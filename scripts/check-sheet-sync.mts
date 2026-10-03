/**
 * Checks the sheet sync against a real database, without a Google account.
 *
 *   npm run dev:db          # in another terminal
 *   npm run sheet:check
 *
 * Canned spreadsheet rows are fed through the actual engine - the same column
 * mapping, the same validation, the same upserts - so what is verified here is
 * the code that runs in production, not a re-implementation of it.
 *
 * Every event it creates has a title starting "Check", so the derived keys all
 * start `check-` and can be cleaned up without touching anything real.
 */

import { eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";
import { parseSheetDate, parseSheetTime } from "../src/lib/sheets/event-row";
import { syncEventsFromSheet } from "../src/lib/sheets/sync";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Start `npm run dev:db` first.");
  process.exit(1);
}

const client = postgres(url, { prepare: false, max: 1 });
const db = drizzle(client, { schema });

let failures = 0;

function check(what: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(
    `  ${ok ? "ok  " : "FAIL"}  ${what}${
      ok
        ? ""
        : `\n          expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    }`,
  );
}

/* -------------------------------------------------------------------------- */
/* Dates and times                                                             */
/* -------------------------------------------------------------------------- */

console.log("\nDates and times\n");

check("2026-10-23", parseSheetDate("2026-10-23"), "2026-10-23");
check("23/10/2026 is day-first", parseSheetDate("23/10/2026"), "2026-10-23");
check("05/06/2026 is 5 June", parseSheetDate("05/06/2026"), "2026-06-05");
check("23 October 2026", parseSheetDate("23 October 2026"), "2026-10-23");
check("Friday 23 Oct 2026", parseSheetDate("Friday 23 Oct 2026"), "2026-10-23");
check("23rd Oct 26", parseSheetDate("23rd Oct 26"), "2026-10-23");
check("31 February is refused", parseSheetDate("2026-02-31"), null);
check("month 13 is refused", parseSheetDate("2026-13-01"), null);
check("gibberish is refused", parseSheetDate("next Tuesday"), null);

check("19:00", parseSheetTime("19:00"), "19:00");
check("7pm", parseSheetTime("7pm"), "19:00");
check("7:30 PM", parseSheetTime("7:30 PM"), "19:30");
check("7.30pm", parseSheetTime("7.30pm"), "19:30");
check("12am is midnight", parseSheetTime("12am"), "00:00");
check("12pm is midday", parseSheetTime("12pm"), "12:00");
check("25:00 is refused", parseSheetTime("25:00"), null);
check("13pm is refused", parseSheetTime("13pm"), null);

/* -------------------------------------------------------------------------- */
/* The engine                                                                  */
/* -------------------------------------------------------------------------- */

/** No Key column at all - identity comes from the title and the date. */
const HEADERS = [
  "Title",
  "Summary",
  "Date",
  "Start time",
  "End time",
  "Venue",
  "Kind",
  "Category",
  "Ticketing",
  "Capacity",
  "Collaborators",
  "Published",
  "Poster URL",
  "Poster alt",
  "Slug",
];

/** For the one case that pins identity explicitly. */
const HEADERS_WITH_KEY = ["Key", ...HEADERS];

type Cells = Partial<Record<string, string>>;

/** Builds a row from a partial, so each case only states what it is about. */
function rowFor(headings: string[], values: Cells): string[] {
  return headings.map((heading) => values[heading] ?? "");
}

const row = (values: Cells) => rowFor(HEADERS, values);
const keyedRow = (values: Cells) => rowFor(HEADERS_WITH_KEY, values);

const sheetOf =
  (rows: string[][], headings: string[] = HEADERS) =>
  async () => [headings, ...rows];

async function ownedEvents() {
  return db
    .select()
    .from(schema.events)
    .where(like(schema.events.sheetRowKey, "check-%"));
}

async function cleanUp() {
  await db
    .delete(schema.events)
    .where(like(schema.events.sheetRowKey, "check-%"));
}

/** The two rows most sections start from. */
const MUSHAIRA: Cells = {
  Title: "Check Mushaira",
  Summary: "An evening of poetry.",
  Date: "23/10/2026",
  "Start time": "7pm",
  "End time": "9pm",
  Venue: "Trinity Old Combination Room",
  Category: "cultural",
  Published: "yes",
};

const CHAI: Cells = {
  Title: "Check Chai and Chat",
  Summary: "Drop in for chai.",
  Date: "2026-11-05",
  Published: "no",
};

await cleanUp();

/* -------------------------------------------------------------------------- */

console.log("\nRequired columns\n");

let report = await syncEventsFromSheet({
  trigger: "manual",
  readValues: sheetOf([["An evening of poetry.", "23/10/2026"]], [
    "Summary",
    "Date",
  ]),
});
check("a sheet with no Title column fails", report.ok, false);
check(
  "and says which column is missing",
  report.errorMessage?.includes("title"),
  true,
);

report = await syncEventsFromSheet({
  trigger: "manual",
  readValues: sheetOf([row(MUSHAIRA)]),
});
check("but Key is not required", report.ok, true);
check("row went through", report.created, 1);

/* -------------------------------------------------------------------------- */

console.log("\nDerived identity\n");

await cleanUp();

report = await syncEventsFromSheet({
  trigger: "manual",
  readValues: sheetOf([row(MUSHAIRA), row(CHAI)]),
});

check("two created", report.created, 2);
check("no problems", report.problems, []);

let rows = await ownedEvents();
let a = rows.find((event) => event.title === "Check Mushaira");
const b = rows.find((event) => event.title === "Check Chai and Chat");

check("key is title + date", a?.sheetRowKey, "check-mushaira-2026-10-23");
check("published flag honoured", [a?.published, b?.published], [true, false]);
check("slug carries the date", a?.slug, "check-mushaira-2026-10-23");
check("venue stored", a?.venue, "Trinity Old Combination Room");
// 23 October 2026 is BST, so 7pm London is 18:00Z. Getting this wrong is the
// single most likely bug in the whole feature.
check("7pm BST stored as 18:00Z", a?.startsAt?.toISOString(), "2026-10-23T18:00:00.000Z");
check("end time stored", a?.endsAt?.toISOString(), "2026-10-23T20:00:00.000Z");
check("no start time means showTime false", b?.showTime, false);
check("midday stored for a date-only row", b?.startsAt?.toISOString(), "2026-11-05T12:00:00.000Z");
check("no bookings without a Ticketing column", a?.ticketing, "none");
check("uncapped without a Capacity column", a?.capacity, null);

/* -------------------------------------------------------------------------- */

console.log("\nTBC details\n");

await cleanUp();

report = await syncEventsFromSheet({
  trigger: "manual",
  readValues: sheetOf([
    row({
      Title: "Check Chai and Chat",
      Summary: "TBC",
      Date: "TBC",
      "Start time": "TBC",
      "End time": "TBC",
      Venue: "TBC",
      Kind: "social",
      Category: "social",
      Published: "TRUE",
    }),
  ]),
});

check("TBC row created", report.created, 1);
check("TBC row has no problems", report.problems, []);
rows = await ownedEvents();
const tbc = rows[0];
check("TBC date stored without an invented date", tbc?.startsAt, null);
check("TBC time is hidden", tbc?.showTime, false);
check("TBC identity is stable", tbc?.sheetRowKey, "check-chai-and-chat-tbc");
check("other TBC text is kept", [tbc?.summary, tbc?.venue], ["TBC", "TBC"]);
check("TBC row can be published", tbc?.published, true);

/* -------------------------------------------------------------------------- */

console.log("\nEditing a row that keeps its title and date\n");

await cleanUp();

await syncEventsFromSheet({
  trigger: "manual",
  readValues: sheetOf([row(MUSHAIRA), row(CHAI)]),
});

report = await syncEventsFromSheet({
  trigger: "manual",
  readValues: sheetOf([
    row({
      ...MUSHAIRA,
      Venue: "Trinity Winstanley Lecture Theatre",
      Collaborators: "PakSoc, Majlis",
      "End time": "",
    }),
    row(CHAI),
  ]),
});

check("nothing created", report.created, 0);
check("nothing unpublished", report.unpublished, 0);

rows = await ownedEvents();
a = rows.find((event) => event.title === "Check Mushaira");
check("still two events", rows.length, 2);
check("venue updated in place", a?.venue, "Trinity Winstanley Lecture Theatre");
check("collaborators parsed", a?.collaborators, ["PakSoc", "Majlis"]);
check("isCollaboration inferred", a?.isCollaboration, true);
// The end time was removed from the sheet, so it must be cleared here too -
// a sync that only ever adds would leave a stale 9pm finish on the page.
check("removed end time is cleared", a?.endsAt, null);

/* -------------------------------------------------------------------------- */

console.log("\nSorting the sheet changes nothing\n");

report = await syncEventsFromSheet({
  trigger: "manual",
  // The same two events, in the other order. This is the case a positional
  // key would get catastrophically wrong.
  readValues: sheetOf([row(CHAI), row({ ...MUSHAIRA, "End time": "" })]),
});

check("nothing created", report.created, 0);
check("nothing unpublished", report.unpublished, 0);
check("nothing skipped", report.problems, []);
check("still two events", (await ownedEvents()).length, 2);

/* -------------------------------------------------------------------------- */

console.log("\nRetitling makes a different event (the documented cost)\n");

report = await syncEventsFromSheet({
  trigger: "manual",
  readValues: sheetOf([
    row({ ...MUSHAIRA, Title: "Check Mushaira Night" }),
    row(CHAI),
  ]),
});

check("the new title is a new event", report.created, 1);
check("and the old one is unpublished", report.unpublished, 1);

rows = await ownedEvents();
const old = rows.find((event) => event.title === "Check Mushaira");
const renamed = rows.find((event) => event.title === "Check Mushaira Night");

check("the old row still exists - never deleted", Boolean(old), true);
check("but is no longer published", old?.published, false);
check("the new one is published", renamed?.published, true);
check("and has its own address", renamed?.slug, "check-mushaira-night-2026-10-23");

/* -------------------------------------------------------------------------- */

console.log("\nA Key column pins identity across a retitle\n");

await cleanUp();

await syncEventsFromSheet({
  trigger: "manual",
  readValues: sheetOf(
    [
      keyedRow({
        Key: "check-pinned",
        Title: "Check Before",
        Summary: "A talk.",
        Date: "2026-10-30",
        Published: "yes",
      }),
    ],
    HEADERS_WITH_KEY,
  ),
});

report = await syncEventsFromSheet({
  trigger: "manual",
  readValues: sheetOf(
    [
      keyedRow({
        Key: "check-pinned",
        Title: "Check After",
        Summary: "A talk.",
        Date: "2026-10-30",
        Published: "yes",
      }),
    ],
    HEADERS_WITH_KEY,
  ),
});

check("retitle is a plain update", [report.created, report.updated], [0, 1]);
check("nothing unpublished", report.unpublished, 0);

rows = await ownedEvents();
check("still one event", rows.length, 1);
check("with the new title", rows[0]?.title, "Check After");
check("and the original address", rows[0]?.slug, "check-before-2026-10-30");

/* -------------------------------------------------------------------------- */

console.log("\nTwo rows that cannot be told apart\n");

await cleanUp();

report = await syncEventsFromSheet({
  trigger: "manual",
  readValues: sheetOf([
    row({ Title: "Check Twice", Summary: "First.", Date: "2026-10-23", Published: "yes" }),
    row({ Title: "Check Twice", Summary: "Second.", Date: "2026-10-23", Published: "yes" }),
  ]),
});

check("one created", report.created, 1);
check("second row refused", report.problems.length, 1);
check(
  "and says why, in the committee's terms",
  report.problems[0]?.includes("same title and date as row 2"),
  true,
);

// The same title on a different day is a different event, not a clash -
// "Chai and Chat" happens every term.
report = await syncEventsFromSheet({
  trigger: "manual",
  readValues: sheetOf([
    row({ Title: "Check Twice", Summary: "First.", Date: "2026-10-23", Published: "yes" }),
    row({ Title: "Check Twice", Summary: "Second.", Date: "2026-10-30", Published: "yes" }),
  ]),
});
check("same title on another day is fine", report.problems, []);
check("and is its own event", (await ownedEvents()).length, 2);

/* -------------------------------------------------------------------------- */

console.log("\nBad rows\n");

await cleanUp();

report = await syncEventsFromSheet({
  trigger: "manual",
  readValues: sheetOf([
    row(MUSHAIRA),
    row({
      Title: "Check Broken",
      Summary: "This row has a date nobody can read.",
      Date: "sometime in March",
      Published: "yes",
    }),
    row({
      Title: "Check Poster",
      Summary: "Poster with no description.",
      Date: "2026-12-01",
      "Poster URL": "https://example.com/poster.jpg",
      Published: "yes",
    }),
  ]),
});

check("the good row still went through", report.created, 1);
check("two rows skipped", report.problems.length, 2);
check(
  "unreadable date is reported with its row number",
  report.problems[0]?.startsWith("Row 3:"),
  true,
);
check(
  "poster with no alt is reported",
  report.problems[1]?.includes("Poster alt is blank"),
  true,
);
check("bad rows created nothing", (await ownedEvents()).length, 1);

/* -------------------------------------------------------------------------- */

console.log("\nAn explicit Slug\n");

await cleanUp();

await syncEventsFromSheet({
  trigger: "manual",
  readValues: sheetOf([row({ ...MUSHAIRA, Slug: "check-poetry-night" })]),
});

rows = await ownedEvents();
check("sets the address", rows[0]?.slug, "check-poetry-night");
check("but identity is still title + date", rows[0]?.sheetRowKey, "check-mushaira-2026-10-23");

/* -------------------------------------------------------------------------- */

console.log("\nRows the sheet does not own\n");

const [manual] = await db
  .insert(schema.events)
  .values({
    slug: "check-manual-event",
    title: "Written by hand",
    summary: "Not from the sheet.",
    startsAt: new Date("2026-03-01T19:00:00Z"),
    published: true,
  })
  .returning();

report = await syncEventsFromSheet({
  trigger: "manual",
  readValues: sheetOf([row(MUSHAIRA)]),
});

const [stillThere] = await db
  .select()
  .from(schema.events)
  .where(eq(schema.events.id, manual.id));

check("hand-written event untouched", stillThere?.published, true);
check("and not counted as unpublished", report.unpublished, 0);

await db.delete(schema.events).where(eq(schema.events.id, manual.id));

/* -------------------------------------------------------------------------- */

await cleanUp();
await client.end();

console.log(
  failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) FAILED.\n`,
);
process.exit(failures === 0 ? 0 : 1);
