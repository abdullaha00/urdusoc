/**
 * Verifies the schema, migrations and seed against a real Postgres - an
 * in-process one (PGlite), so this needs no server, no Docker and no secrets.
 *
 * Run it after changing the schema: `npm run db:verify`.
 */

import { PGlite } from "@electric-sql/pglite";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../src/lib/db/schema";
import { seed } from "../src/lib/db/seed";

let failures = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures += 1;
    console.error(`  FAIL  ${label}${detail ? ` - ${detail}` : ""}`);
  }
}

const client = new PGlite();
const db = drizzle(client, { schema });

console.log("\nApplying migrations…");
await migrate(db, { migrationsFolder: "./drizzle" });

const tables = await db.execute<{ table_name: string }>(
  sql`select table_name from information_schema.tables where table_schema = 'public' order by table_name`,
);
const tableNames = (tables.rows ?? []).map((row) => row.table_name);
console.log(`  ${tableNames.length} tables: ${tableNames.join(", ")}`);

console.log("\nSeeding…");
const summary = await seed(db, "committee@example.com");
for (const line of summary) console.log(`  ${line}`);

console.log("\nChecking seeded content…");

const events = await db.select().from(schema.events);
check(
  "five published Michaelmas events",
  events.length === 5 && events.every((event) => event.published),
  String(events.length),
);
check(
  "the term card's confirmed events are seeded",
  [
    "Chai and Chat",
    "Cambridge South Asia Tour",
    "Jinn-o-ween",
    "Iqbal and the Poetics of Awakening",
    "Talk with Dr Hina Khalid",
  ].every((title) => events.some((event) => event.title === title)),
);
const chai = events.find((event) => event.slug === "chai-and-chat-2026-10-11");
check(
  "Chai and Chat runs 3–6pm UK time",
  chai?.startsAt?.toISOString() === "2026-10-11T14:00:00.000Z" &&
    chai.endsAt?.toISOString() === "2026-10-11T17:00:00.000Z",
  chai?.startsAt?.toISOString(),
);
check(
  "events without a confirmed hour show only their date",
  events
    .filter((event) => event.startsAt && event.startsAt >= new Date("2026-10-29"))
    .every((event) => !event.showTime),
);

const featured = await db
  .select()
  .from(schema.verses)
  .where(eq(schema.verses.featured, true));
check("exactly one featured verse", featured.length === 1);
check(
  "featured verse is the Ghalib couplet",
  featured[0]?.urduLines.length === 2 && featured[0]?.poetName === "Mirza Ghalib",
);
check(
  "verse arrays survive a round trip",
  featured[0]?.transliterationLines[1] ===
    "bahut nikle mire armān lekin phir bhī kam nikle",
  featured[0]?.transliterationLines[1],
);

const albums = await db.select().from(schema.albums);
check("three gallery albums", albums.length === 3, String(albums.length));
check(
  "albums carry their CSS motif fallback",
  albums.every((album) => album.motif !== null),
);

const committee = await db.select().from(schema.committee);
check("committee roles seeded", committee.length === 7, String(committee.length));
check(
  "no fabricated committee names",
  committee.every((person) => person.name === "To be announced"),
);

const admins = await db.select().from(schema.admins);
check("seed admin is an owner", admins.length === 1 && admins[0].role === "owner");

console.log("\nChecking constraints…");

await db.insert(schema.registrations).values({
  eventId: events[0].id,
  name: "Test Person",
  email: "test@example.com",
  reference: "TEST-0001",
});

let duplicateRejected = false;
try {
  await db.insert(schema.registrations).values({
    eventId: events[0].id,
    name: "Test Person Again",
    email: "test@example.com",
    reference: "TEST-0002",
  });
} catch {
  duplicateRejected = true;
}
check("one registration per email per event", duplicateRejected);

let cascadeWorked = false;
await db.delete(schema.events).where(eq(schema.events.id, events[0].id));
const orphaned = await db.select().from(schema.registrations);
cascadeWorked = orphaned.length === 0;
check("registrations are removed with their event", cascadeWorked);

console.log("\nRe-running seed (idempotency)…");
const second = await seed(db, "committee@example.com");
for (const line of second) console.log(`  ${line}`);
const versesAfter = await db.select().from(schema.verses);
check("seed did not duplicate verses", versesAfter.length === 3, String(versesAfter.length));
const eventsAfter = await db.select().from(schema.events);
check("seed restored one deleted event", eventsAfter.length === 5, String(eventsAfter.length));

await client.close();

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.\n`);
  process.exit(1);
}
console.log("\nAll database checks passed.\n");
