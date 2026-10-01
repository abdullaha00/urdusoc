/**
 * Imports the society's past events from scripts/data/past-events.ts.
 *
 * Run migrations first, then:
 *   env DATABASE_URL="…" npm run db:import-events
 *
 * Safe to re-run: events conflict on their slug, so re-running as you fill in
 * more of the data file inserts only what is new. Entries still marked TODO are
 * reported and skipped - a missing date must never become a published one.
 *
 * An event already in the database is left exactly as it is, because the
 * committee may have improved it at /admin and a script must not undo that.
 * Two exceptions, both deliberate:
 *
 *   · An entry carrying `supersedes` names the slug it used to have, because a
 *     correction changed its title or its date. The old row is renamed rather
 *     than a second copy inserted beside it.
 *   · `--refresh` rewrites archive rows from the data file. Use it when the
 *     file has gained venues, times or descriptions that the database rows
 *     predate, and only when nobody has been editing those events by hand.
 *   · `--links-only` fills in `instagram_url` where a row has none and changes
 *     nothing else. It exists for the database you cannot casually restore:
 *     `--refresh` would carry the whole data file across every archive row,
 *     and the links are usually the only thing missing.
 *
 * None of them ever touches a row with a `sheet_row_key`: those belong to the
 * committee's Google Sheet, and this script is not its owner.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { and, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";
import { parseLondonDateTime } from "../src/lib/format";
import { slugify } from "../src/lib/slug";
import {
  categoryFor,
  pastEvents,
  TODO,
  type PastEventInput,
} from "./data/past-events";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const refresh = process.argv.includes("--refresh");
const linksOnly = process.argv.includes("--links-only");

if (refresh && linksOnly) {
  console.error("Pass --refresh or --links-only, not both.");
  process.exit(1);
}

/** A bare calendar date, meaning the hour was never recorded. */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Fields that must be settled before an event can be published. Venue is not
 * among them - most historical events never recorded one, and the site omits
 * the line rather than showing a gap.
 */
function missingFields(event: PastEventInput): string[] {
  const required = {
    title: event.title,
    summary: event.summary,
    startsAt: event.startsAt,
  };

  return Object.entries(required)
    .filter(([, value]) => !value?.trim() || value.trim() === TODO)
    .map(([field]) => field);
}

/**
 * Slugs carry the date.
 *
 * Several titles repeat across terms - four welcome socials, two "Chai and
 * Chat!", two brunches, two iftar potlucks. A bare slug would collide, and
 * since the insert conflicts on slug the second one would be silently dropped
 * rather than reported. The date also reads well in an archive URL:
 * /events/mushaira-iqbal-day-2025-11-16.
 */
function slugFor(title: string, isoDate: string): string {
  return `${slugify(title, "event")}-${isoDate}`;
}

/**
 * Where each archived poster ended up in Blob storage, written by
 * `npm run blob:upload` and committed.
 *
 * Absent or incomplete is not an error: an event whose poster has not been
 * uploaded is imported without one, which is the normal state of most events
 * anyway. The missing ones are reported at the end so nobody has to guess why
 * a card came out plain.
 */
async function loadPosterUrls(): Promise<Map<string, string>> {
  try {
    const raw = await readFile(
      join("scripts", "data", "instagram", "uploads.json"),
      "utf8",
    );
    const parsed = JSON.parse(raw) as { uploads: { file: string; url: string }[] };
    return new Map(parsed.uploads.map((record) => [record.file, record.url]));
  } catch {
    return new Map();
  }
}

/**
 * The permalink of the post each archived picture came from, keyed by file
 * name, read from the archive manifest written by `npm run instagram:archive`.
 *
 * This is where an event's Instagram link comes from, rather than the `source`
 * line: the manifest records who owns each post, so a poster taken from a
 * partner society's account cannot become a link we present as ours. An event
 * whose artwork we never archived simply has no link, which is also the honest
 * answer for the evenings a partner announced.
 */
async function loadSocietyPermalinks(): Promise<Map<string, string>> {
  const permalinks = new Map<string, string>();

  try {
    const raw = await readFile(
      join("scripts", "data", "instagram", "manifest.json"),
      "utf8",
    );
    const parsed = JSON.parse(raw) as {
      posts: { owner?: string; url?: string; files: { file: string }[] }[];
    };

    for (const post of parsed.posts) {
      if (post.owner !== SOCIETY_ACCOUNT || !post.url) continue;
      for (const file of post.files) permalinks.set(file.file, post.url);
    }
  } catch {
    // No manifest on this machine: events import without their links, exactly
    // as they did before the links existed.
  }

  return permalinks;
}

/** The society's own account. Only its posts are linked from an event. */
const SOCIETY_ACCOUNT = "cambridgeurdusoc";

const posterUrls = await loadPosterUrls();
const societyPermalinks = await loadSocietyPermalinks();
const postersMissing: string[] = [];

const client = postgres(url, { prepare: false, max: 1 });
const db = drizzle(client, { schema });

let inserted = 0;
let renamed = 0;
let refreshed = 0;
let linked = 0;
let alreadyPresent = 0;
const skipped: string[] = [];
const warnings: string[] = [];
/** Catches two entries in the file that would map to the same URL. */
const seenSlugs = new Set<string>();

console.log(
  `\nImporting ${pastEvents.length} event(s)${
    refresh
      ? " (--refresh: archive rows will be rewritten)"
      : linksOnly
        ? " (--links-only: only a missing instagram_url is written)"
        : ""
  }…\n`,
);

for (const event of pastEvents) {
  const missing = missingFields(event);
  if (missing.length > 0) {
    skipped.push(`${event.title} - still TODO: ${missing.join(", ")}`);
    continue;
  }

  // A bare date means the hour was never recorded: store midday so the row
  // sorts onto the right day in any timezone, and mark it not to be displayed.
  const showTime = !DATE_ONLY.test(event.startsAt);
  const isoDate = event.startsAt.slice(0, 10);

  // The same helper the admin form uses, so "19:00" means 7pm in Cambridge
  // rather than 7pm UTC.
  const startsAt = parseLondonDateTime(
    showTime ? event.startsAt : `${event.startsAt}T12:00`,
  );
  if (!startsAt) {
    skipped.push(
      `${event.title} - "${event.startsAt}" is not a valid date (expected YYYY-MM-DD or YYYY-MM-DDTHH:mm)`,
    );
    continue;
  }

  const slug = slugFor(event.title, isoDate);
  if (seenSlugs.has(slug)) {
    skipped.push(`${event.title} - duplicate of another entry on ${isoDate}`);
    continue;
  }
  seenSlugs.add(slug);

  // A poster is only ever set from a file that has actually been uploaded, and
  // `posterAlt` always travels with it: the admin form refuses one without the
  // other, and so does this.
  const posterUrl = event.poster ? (posterUrls.get(event.poster.file) ?? null) : null;
  if (event.poster && !posterUrl) postersMissing.push(event.poster.file);

  // The post the poster was published in. Independent of whether the picture
  // itself reached Blob storage: the link is worth having either way.
  const instagramUrl = event.poster
    ? (societyPermalinks.get(event.poster.file) ?? null)
    : null;

  const values = {
    slug,
    title: event.title,
    titleUrdu: event.titleUrdu ?? null,
    kind: event.kind,
    kindUrdu: event.kindUrdu ?? null,
    category: categoryFor(event),
    isCollaboration: (event.collaborators?.length ?? 0) > 0,
    collaborators: event.collaborators ?? [],
    summary: event.summary,
    body: event.body ?? null,
    startsAt,
    showTime,
    venue: event.venue ?? null,
    posterUrl,
    posterAlt: posterUrl ? (event.poster?.alt ?? null) : null,
    instagramUrl,
    // Past events take no bookings, and are visible so they appear under
    // "Past" on /events.
    ticketing: "none" as const,
    published: true,
  };

  // Links only: fill the gap and leave everything else exactly as it is. The
  // three conditions are all part of the statement rather than checks around
  // it, so a row that is sheet-owned, already linked, or simply not there
  // cannot be written to by accident.
  if (linksOnly) {
    if (!instagramUrl) continue;

    const [updated] = await db
      .update(schema.events)
      .set({ instagramUrl })
      .where(
        and(
          eq(schema.events.slug, slug),
          isNull(schema.events.sheetRowKey),
          isNull(schema.events.instagramUrl),
        ),
      )
      .returning({ id: schema.events.id });

    if (updated) {
      linked += 1;
      console.log(`  linked   ${event.title}`);
    } else {
      alreadyPresent += 1;
    }
    continue;
  }

  // A correction has changed this event's title or date since it was last
  // imported. Rename the row that is already there rather than leaving the
  // database holding both versions of the same evening.
  if (event.supersedes) {
    const [old] = await db
      .select({ id: schema.events.id, sheetRowKey: schema.events.sheetRowKey })
      .from(schema.events)
      .where(eq(schema.events.slug, event.supersedes));

    if (old) {
      if (old.sheetRowKey) {
        warnings.push(
          `${event.title} - "${event.supersedes}" is owned by the Google Sheet; left alone`,
        );
      } else {
        const [current] = await db
          .select({ id: schema.events.id })
          .from(schema.events)
          .where(eq(schema.events.slug, slug));

        if (current) {
          warnings.push(
            `${event.title} - both "${event.supersedes}" and "${slug}" exist; delete the stale one at /admin/events`,
          );
        } else {
          await db
            .update(schema.events)
            .set({ ...values, updatedAt: new Date() })
            .where(eq(schema.events.id, old.id));
          renamed += 1;
          console.log(`  renamed  ${event.title}  (was ${event.supersedes})`);
          continue;
        }
      }
    }
  }

  const rows = await db
    .insert(schema.events)
    .values(values)
    .onConflictDoNothing({ target: schema.events.slug })
    .returning({ id: schema.events.id });

  if (rows.length > 0) {
    inserted += 1;
    console.log(`  added    ${event.title}`);
    continue;
  }

  if (refresh) {
    // Archive rows only: anything the sheet owns is none of our business, so
    // the condition is part of the statement rather than a check afterwards.
    const [updated] = await db
      .update(schema.events)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(eq(schema.events.slug, slug), isNull(schema.events.sheetRowKey)),
      )
      .returning({ id: schema.events.id });

    if (updated) {
      refreshed += 1;
      console.log(`  updated  ${event.title}`);
    } else {
      alreadyPresent += 1;
      warnings.push(
        `${event.title} - owned by the Google Sheet; not refreshed`,
      );
      console.log(`  present  ${event.title}`);
    }
    continue;
  }

  alreadyPresent += 1;
  console.log(`  present  ${event.title}`);
}

await client.end();

console.log(
  linksOnly
    ? `\n${linked} event(s) linked to their Instagram post, ${alreadyPresent} left alone.`
    : `\n${inserted} added, ${renamed} renamed, ${refreshed} updated, ${alreadyPresent} already present.`,
);

if (warnings.length > 0) {
  console.log(`\n${warnings.length} need a human:`);
  for (const line of warnings) console.log(`  · ${line}`);
}

if (postersMissing.length > 0) {
  console.log(
    `\n${postersMissing.length} event(s) name a poster that is not in uploads.json, and were imported without one:`,
  );
  for (const file of postersMissing) console.log(`  · ${file}`);
  console.log("\nRun `npm run blob:upload`, then this again with --refresh.");
}

if (skipped.length > 0) {
  console.log(`\n${skipped.length} skipped - not imported:`);
  for (const line of skipped) console.log(`  · ${line}`);
  console.log(
    "\nFill these in at scripts/data/past-events.ts and run this again.\n",
  );
} else {
  console.log("");
}

if (!refresh && alreadyPresent > 0) {
  console.log(
    "Rows already present were left untouched. If this file has since gained\ntimes, venues or descriptions they do not have, re-run with --refresh.\n",
  );
}
