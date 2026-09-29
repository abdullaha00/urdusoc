/**
 * Imports the society's past events from scripts/data/past-events.ts.
 *
 * Run migrations first, then:
 *   env DATABASE_URL="…" npm run db:import-events
 *
 * Safe to re-run: events conflict on their slug, so re-running as you fill in
 * more of the data file inserts only what is new. Entries still marked TODO are
 * reported and skipped — a missing date must never become a published one.
 */

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

/** A bare calendar date, meaning the hour was never recorded. */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Fields that must be settled before an event can be published. Venue is not
 * among them — most historical events never recorded one, and the site omits
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
 * Several titles repeat across terms — two "Chai and Chat!", two brunches, two
 * iftar potlucks. A bare slug would collide, and since the insert conflicts on
 * slug the second one would be silently dropped rather than reported. The date
 * also reads well in an archive URL: /events/mushaira-iqbal-day-2025-11-09.
 */
function slugFor(title: string, isoDate: string): string {
  return `${slugify(title, "event")}-${isoDate}`;
}

const client = postgres(url, { prepare: false, max: 1 });
const db = drizzle(client, { schema });

let inserted = 0;
let alreadyPresent = 0;
const skipped: string[] = [];
/** Catches two entries in the file that would map to the same URL. */
const seenSlugs = new Set<string>();

console.log(`\nImporting ${pastEvents.length} event(s)…\n`);

for (const event of pastEvents) {
  const missing = missingFields(event);
  if (missing.length > 0) {
    skipped.push(`${event.title} — still TODO: ${missing.join(", ")}`);
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
      `${event.title} — "${event.startsAt}" is not a valid date (expected YYYY-MM-DD or YYYY-MM-DDTHH:mm)`,
    );
    continue;
  }

  const slug = slugFor(event.title, isoDate);
  if (seenSlugs.has(slug)) {
    skipped.push(`${event.title} — duplicate of another entry on ${isoDate}`);
    continue;
  }
  seenSlugs.add(slug);

  const rows = await db
    .insert(schema.events)
    .values({
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
      // Past events take no bookings, and are visible so they appear under
      // "Past" on /events.
      ticketing: "none",
      published: true,
    })
    .onConflictDoNothing({ target: schema.events.slug })
    .returning({ id: schema.events.id });

  if (rows.length > 0) {
    inserted += 1;
    console.log(`  added    ${event.title}`);
  } else {
    alreadyPresent += 1;
    console.log(`  present  ${event.title}`);
  }
}

await client.end();

console.log(`\n${inserted} added, ${alreadyPresent} already present.`);

if (skipped.length > 0) {
  console.log(`\n${skipped.length} skipped — not imported:`);
  for (const line of skipped) console.log(`  · ${line}`);
  console.log(
    "\nFill these in at scripts/data/past-events.ts and run this again.\n",
  );
} else {
  console.log("");
}
