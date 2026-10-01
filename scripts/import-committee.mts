/**
 * Imports every committee the society has had, from scripts/data/committee.ts.
 *
 * Run migrations first, then:
 *   env DATABASE_URL="…" npm run db:import-committee
 *
 * A year already holding real people is left completely alone, and reported.
 * The roster is the committee's to edit at /admin, and a script that reran over
 * the top of their corrections would be worse than no script. The one thing
 * this will overwrite is the "To be announced" placeholders the seed inserts:
 * a year made only of those has never been filled in, so there is nothing to
 * lose and a whole roster to gain.
 *
 * Re-running is therefore a no-op once a year has been imported - unless you
 * pass `--refresh`, which replaces every year in this file with what the file
 * now says. That exists because this data file keeps improving: the first
 * version held only the first names the captions gave, and the full names and
 * Urdu spellings came later, off the announcement cards themselves. Use it when
 * the file has learned something the database has not, and not when somebody
 * has been correcting the roster by hand.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { and, eq, inArray, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";
import { committeeYears, PLACEHOLDER_NAME } from "./data/committee";
import { committeePortraits } from "./data/curated-media";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const refresh = process.argv.includes("--refresh");

async function loadPortraitUrls(): Promise<Map<string, string>> {
  try {
    const raw = await readFile(
      join("scripts", "data", "instagram", "media-uploads.json"),
      "utf8",
    );
    const parsed = JSON.parse(raw) as {
      uploads: { pathname: string; url: string }[];
    };
    const byPath = new Map(
      parsed.uploads.map((record) => [record.pathname, record.url]),
    );
    return new Map(
      committeePortraits.flatMap((portrait) => {
        const url = byPath.get(portrait.asset.pathname);
        return url
          ? [[`${portrait.academicYear}\0${portrait.name}`, url] as const]
          : [];
      }),
    );
  } catch {
    return new Map();
  }
}

const portraitUrls = await loadPortraitUrls();

const client = postgres(url, { prepare: false, max: 1 });
const db = drizzle(client, { schema });

let people = 0;
let replacedYears = 0;
let cohorts = 0;
const skippedYears: string[] = [];
const warnings: string[] = [];

const currentYear = committeeYears.find((year) => year.isCurrent)?.academicYear;

console.log(`\nImporting ${committeeYears.length} committee year(s)…\n`);

for (const year of committeeYears) {
  const existing = await db
    .select({
      id: schema.committee.id,
      name: schema.committee.name,
      photoUrl: schema.committee.photoUrl,
    })
    .from(schema.committee)
    .where(eq(schema.committee.academicYear, year.academicYear));

  const real = existing.filter((row) => row.name !== PLACEHOLDER_NAME);
  if (real.length > 0 && !refresh) {
    skippedYears.push(
      `${year.academicYear} - ${real.length} person(s) already on the roster; left as they are`,
    );
    console.log(`  present  ${year.academicYear}`);
    continue;
  }
  if (real.length > 0) replacedYears += 1;

  // Keep any hand-added portrait through --refresh. Curated portraits take
  // precedence so a newly uploaded replacement reaches the roster.
  const existingPhotos = new Map(
    existing.flatMap((row) =>
      row.photoUrl ? [[row.name, row.photoUrl] as const] : [],
    ),
  );

  if (existing.length > 0) {
    // Either the seed's "To be announced" placeholders, which nobody would
    // miss, or - under --refresh - a roster this file now knows better than.
    // Nothing references `committee.id`, so clearing the year is safe.
    await db.delete(schema.committee).where(
      inArray(
        schema.committee.id,
        existing.map((row) => row.id),
      ),
    );
  }

  await db.insert(schema.committee).values(
    year.members.map((member, index) => ({
      name: member.vacant ? PLACEHOLDER_NAME : member.name,
      nameUrdu: member.nameUrdu ?? null,
      role: member.role,
      bio: member.bio ?? null,
      college: member.college ?? null,
      course: member.course ?? null,
      photoUrl: member.vacant
        ? null
        : (portraitUrls.get(`${year.academicYear}\0${member.name}`) ??
          existingPhotos.get(member.name) ??
          null),
      academicYear: year.academicYear,
      isCurrent: year.isCurrent,
      orderIndex: index,
    })),
  );

  people += year.members.length;
  const vacancies = year.members.filter((member) => member.vacant).length;
  const replaced =
    existing.length === 0
      ? ""
      : real.length > 0
        ? `, replacing ${existing.length} existing row(s)`
        : `, replacing ${existing.length} placeholder(s)`;
  console.log(
    `  ${real.length > 0 ? "updated " : "added   "} ${year.academicYear}  ${
      year.members.length
    } role(s)${vacancies > 0 ? ` (${vacancies} vacant)` : ""}${replaced}`,
  );

  // The group photo and the line of context, for years that are over. A cohort
  // row is optional - the archive renders from the roster alone - so this only
  // writes one where there is something to say.
  if (!year.isCurrent && year.note) {
    const inserted = await db
      .insert(schema.committeeCohorts)
      .values({ academicYear: year.academicYear, note: year.note })
      .onConflictDoNothing({ target: schema.committeeCohorts.academicYear })
      .returning({ id: schema.committeeCohorts.id });
    cohorts += inserted.length;
  }
}

// Two committees cannot both be this year's. If an older year is still flagged
// current, /committee will print both rosters under "This year".
if (currentYear) {
  const stale = await db
    .select({ year: schema.committee.academicYear })
    .from(schema.committee)
    .where(
      and(
        eq(schema.committee.isCurrent, true),
        ne(schema.committee.academicYear, currentYear),
      ),
    );

  const years = [...new Set(stale.map((row) => row.year))];
  if (years.length > 0) {
    warnings.push(
      `${years.join(", ")} still marked as the current committee alongside ${currentYear} - fix at /admin/committee`,
    );
  }
}

await client.end();

console.log(
  `\n${people} role(s) written across ${committeeYears.length - skippedYears.length} year(s)${
    replacedYears > 0 ? ` (${replacedYears} refreshed)` : ""
  }, ${cohorts} cohort note(s) added.`,
);

if (skippedYears.length > 0) {
  console.log(`\n${skippedYears.length} year(s) skipped:`);
  for (const line of skippedYears) console.log(`  · ${line}`);
}

if (warnings.length > 0) {
  console.log(`\n${warnings.length} need a human:`);
  for (const line of warnings) console.log(`  · ${line}`);
}

console.log("");
