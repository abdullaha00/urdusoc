/**
 * Seeds a fresh database with the content the site launched with.
 *
 * Running this on an empty database reproduces the original mock-up exactly, so
 * a new deployment looks finished before the committee has added anything.
 * It is idempotent: rows are skipped if a record with the same key exists.
 *
 * Usage: `npm run db:seed` (needs DATABASE_URL, and SEED_ADMIN_EMAIL for the
 * first committee login).
 */

import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

type AnyDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

/** 7pm on Friday 23 October 2026, British Summer Time (UTC+1). */
const FIRST_EVENT_START = new Date("2026-10-23T18:00:00.000Z");

const SOCIETY_ROLES = [
  "President",
  "Vice-President",
  "Treasurer",
  "Secretary",
  "Events Officer",
  "Publicity Officer",
  "Welfare Officer",
];

export async function seed(db: AnyDatabase, adminEmail?: string) {
  const summary: string[] = [];

  /* Events ---------------------------------------------------------------- */
  const insertedEvents = await db
    .insert(schema.events)
    .values({
      slug: "an-evening-of-urdu-poetry",
      title: "An Evening of Urdu Poetry",
      kind: "mushaira",
      kindUrdu: "محفل",
      summary:
        "An evening of ghazal, nazm and new student writing, read aloud between cups of chai.",
      body: [
        "Our termly mushaira brings together students, alumni and guest poets for an",
        "evening of reading aloud. Bring something of your own, bring a favourite by",
        "someone else, or bring nothing at all and simply listen.",
        "",
        "No prior Urdu is needed - every piece is introduced in English.",
      ].join("\n"),
      startsAt: FIRST_EVENT_START,
      venue: "Cambridge Union Blue Room",
      capacity: 80,
      ticketing: "rsvp",
      published: true,
    })
    .onConflictDoNothing({ target: schema.events.slug })
    .returning({ id: schema.events.id });
  summary.push(`events: ${insertedEvents.length} inserted`);

  /* Verses ---------------------------------------------------------------- */
  const verses = [
    {
      urduLines: [
        "ہزاروں خواہشیں ایسی کہ ہر خواہش پہ دم نکلے",
        "بہت نکلے مرے ارمان لیکن پھر بھی کم نکلے",
      ],
      transliterationLines: [
        "hazāroñ ḳhvāhisheñ aisī ki har ḳhvāhish pe dam nikle",
        "bahut nikle mire armān lekin phir bhī kam nikle",
      ],
      translation:
        "A thousand desires, each one enough to take my breath - many of my longings were granted, and still they were too few.",
      poetName: "Mirza Ghalib",
      poetUrdu: "مرزا غالب",
      poetYears: "1797–1869",
      note: "",
      // note: "Read and unpicked line by line at our termly poetry evenings.",
      featured: true,
    },
    {
      urduLines: [
        "دل ہی تو ہے نہ سنگ و خشت درد سے بھر نہ آئے کیوں",
        "روئیں گے ہم ہزار بار کوئی ہمیں ستائے کیوں",
      ],
      transliterationLines: [
        "dil hī to hai na sañg o ḳhisht dard se bhar na aa.e kyuuñ",
        "ro.eñge ham hazār baar koī hameñ satā.e kyuuñ",
      ],
      translation:
        "It is only a heart, not brick and stone - why should it not brim with pain? I will weep a thousand times; why should anyone torment me for it?",
      poetName: "Mirza Ghalib",
      poetUrdu: "مرزا غالب",
      poetYears: "1797–1869",
      featured: false,
    },
    {
      urduLines: ["ہستی اپنی حباب کی سی ہے", "یہ نمائش سراب کی سی ہے"],
      transliterationLines: [
        "hastī apnī hubāb kī sī hai",
        "ye numā.ish sarāb kī sī hai",
      ],
      translation:
        "Our existence is like a bubble; all this show is the seeming of a mirage.",
      poetName: "Mir Taqi Mir",
      poetUrdu: "میر تقی میر",
      poetYears: "1723–1810",
      featured: false,
    },
  ];

  const existingVerses = await db.select({ id: schema.verses.id }).from(schema.verses);
  if (existingVerses.length === 0) {
    await db.insert(schema.verses).values(verses);
    summary.push(`verses: ${verses.length} inserted`);
  } else {
    summary.push("verses: skipped (already present)");
  }

  /* Gallery albums -------------------------------------------------------- */
  const albums = [
    {
      slug: "mushaira",
      title: "Mushaira",
      description: "Poetry read aloud, Michaelmas",
      motif: "mushaira",
      published: true,
    },
    {
      slug: "chai-social",
      title: "Chai social",
      description: "Sidgwick Site, weekly",
      motif: "chai",
      published: true,
    },
    {
      slug: "urdu-calligraphy-workshop",
      title: "Urdu calligraphy workshop",
      description: "Qalam and ink, Lent",
      motif: "calligraphy",
      published: true,
    },
  ];
  const insertedAlbums = await db
    .insert(schema.albums)
    .values(albums)
    .onConflictDoNothing({ target: schema.albums.slug })
    .returning({ id: schema.albums.id });
  summary.push(`albums: ${insertedAlbums.length} inserted`);

  /* Committee roster ------------------------------------------------------ */
  const existingCommittee = await db
    .select({ id: schema.committee.id })
    .from(schema.committee);
  if (existingCommittee.length === 0) {
    await db.insert(schema.committee).values(
      SOCIETY_ROLES.map((role, index) => ({
        // Deliberately not a real person - the committee fills these in at /admin.
        name: "To be announced",
        role,
        academicYear: "2026–27",
        isCurrent: true,
        orderIndex: index,
      })),
    );
    summary.push(`committee: ${SOCIETY_ROLES.length} placeholder roles inserted`);
  } else {
    summary.push("committee: skipped (already present)");
  }

  /* First committee login ------------------------------------------------- */
  if (adminEmail) {
    const inserted = await db
      .insert(schema.admins)
      .values({
        email: adminEmail.toLowerCase(),
        role: "owner",
        name: "Initial owner",
      })
      .onConflictDoNothing({ target: schema.admins.email })
      .returning({ id: schema.admins.id });
    summary.push(
      inserted.length > 0
        ? `admins: ${adminEmail} added as owner`
        : `admins: ${adminEmail} already present`,
    );
  } else {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.admins);
    if (count === 0) {
      summary.push(
        "admins: NONE - set SEED_ADMIN_EMAIL and re-run, or nobody can sign in to /admin",
      );
    }
  }

  return summary;
}
