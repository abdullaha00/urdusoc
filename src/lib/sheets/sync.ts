/**
 * Bringing the events table into line with the committee's Google Sheet.
 *
 * The sheet is the source of truth, but "source of truth" is not the same as
 * "may do anything". Three rules hold this together, and none of them should be
 * relaxed without a good reason:
 *
 *   1. **The sync never deletes an event.** `registrations.eventId` cascades on
 *      delete, so a deleted row would take the door list - names, emails, who
 *      turned up - with it. A row removed from the sheet is unpublished, which
 *      takes it off the site and is reversible.
 *
 *   2. **The sync only touches rows it owns.** An event with no `sheetRowKey`
 *      was written by hand or recovered from an old term card by
 *      `db:import-events`. Those are invisible to this code.
 *
 *   3. **A bad row is skipped, not fatal.** One mistyped date must not stop the
 *      other twenty-nine events reaching the site. Every rejection is recorded
 *      against its spreadsheet row number for /admin/events to display.
 *
 * Deliberately free of Next.js imports - `scripts/sync-events.mts` runs this
 * same code from a terminal, which is how you test a sheet before it is wired
 * up to a deployment. Cache revalidation therefore belongs to the callers that
 * have a request to revalidate for, not here.
 */

import { eq, isNotNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { eventSyncRuns, events } from "@/lib/db/schema";
import { isUniqueViolation, UserFacingError } from "@/lib/errors";
import { env } from "@/lib/env";
import { fetchSheetValues } from "./client";
import {
  isBlankRow,
  mapColumns,
  parseEventRow,
  type ParsedEventRow,
} from "./event-row";

export type SyncReport = {
  ok: boolean;
  rowsRead: number;
  created: number;
  updated: number;
  unpublished: number;
  skipped: number;
  problems: string[];
  errorMessage: string | null;
};

export type SyncTrigger = "cron" | "manual";

/**
 * Reads the sheet and applies it.
 *
 * Never throws for an expected failure - a missing column, an unreachable
 * sheet, bad credentials all come back as `ok: false` with a message fit to
 * show a committee member, and are recorded in `event_sync_runs` either way.
 * The caller decides what to do about it.
 */
export async function syncEventsFromSheet({
  trigger,
  actorEmail = null,
  readValues = fetchSheetValues,
}: {
  trigger: SyncTrigger;
  actorEmail?: string | null;
  /**
   * How to get the cells. Overridden only by the checks in
   * `scripts/check-sheet-sync.mts`, which feed canned rows through the real
   * engine against a local database - everything below this line then gets
   * exercised without a Google account.
   */
  readValues?: () => Promise<string[][]>;
}): Promise<SyncReport> {
  const startedAt = new Date();

  let report: SyncReport;
  try {
    report = await runSync(readValues);
  } catch (error) {
    // UserFacingError messages are written for the committee and say what to
    // fix. Anything else is logged and replaced, so a Postgres error never
    // puts SQL on an admin page.
    const message =
      error instanceof UserFacingError
        ? error.message
        : "The sync failed unexpectedly. The error has been logged.";

    if (!(error instanceof UserFacingError)) {
      console.error("Event sheet sync failed:", error);
    }

    report = {
      ok: false,
      rowsRead: 0,
      created: 0,
      updated: 0,
      unpublished: 0,
      skipped: 0,
      problems: [],
      errorMessage: message,
    };
  }

  await recordRun({ report, trigger, actorEmail, startedAt });

  return report;
}

/** True when the run changed something a visitor could see. */
export function changedPublicPages(report: SyncReport): boolean {
  return Boolean(report.created || report.updated || report.unpublished);
}

async function runSync(
  readValues: () => Promise<string[][]>,
): Promise<SyncReport> {
  // Skipped when the caller supplied its own reader: the checks do not need
  // Google credentials to exercise the engine.
  if (readValues === fetchSheetValues && !env.eventsSheetEnabled) {
    throw new UserFacingError(
      "The events spreadsheet is not connected yet. See .env.example for the " +
        "three variables it needs.",
    );
  }

  const values = await readValues();

  // Leading blank rows are common - people put a title or a note above the
  // table. The first row with anything in it is taken as the headings.
  const headerIndex = values.findIndex((row) => !isBlankRow(row));
  if (headerIndex === -1) {
    throw new UserFacingError(
      "The spreadsheet is empty. Add the heading row first - " +
        "`npm run sheet:headers` prints one you can paste in.",
    );
  }

  const { columns, missing } = mapColumns(values[headerIndex]);
  if (missing.length > 0) {
    throw new UserFacingError(
      `The spreadsheet is missing ${
        missing.length === 1 ? "a column" : "columns"
      }: ${missing.join(", ")}. Check the heading row spelling.`,
    );
  }

  const db = getDb();

  // Every event the sheet owns, as things stand. Read before the rows are
  // walked so that created and updated can be told apart, so rows that have
  // left the sheet are known, and so the slug check below can tell which rows
  // are actually about to claim an address.
  const owned = await db
    .select({
      id: events.id,
      key: events.sheetRowKey,
      published: events.published,
    })
    .from(events)
    .where(isNotNull(events.sheetRowKey));

  const ownedByKey = new Map(
    owned.flatMap((row) => (row.key ? [[row.key, row] as const] : [])),
  );

  const problems: string[] = [];
  const parsed: ParsedEventRow[] = [];
  const seenKeys = new Map<string, number>();
  const seenSlugs = new Map<string, number>();
  let rowsRead = 0;

  for (let index = headerIndex + 1; index < values.length; index += 1) {
    const row = values[index];
    if (isBlankRow(row)) continue;

    // Spreadsheet row numbers are 1-based, and `values` starts at the top of
    // the requested range, so this is what the committee sees in the gutter.
    const rowNumber = index + 1;
    rowsRead += 1;

    const result = parseEventRow(row, columns, rowNumber);
    if (!result.ok) {
      problems.push(...result.problems);
      continue;
    }

    // Two rows sharing an identity would fight over one database row, each
    // run overwriting the other - an event that changes every fifteen minutes.
    const duplicateKey = seenKeys.get(result.row.key);
    if (duplicateKey !== undefined) {
      problems.push(
        result.row.keyExplicit
          ? `Row ${rowNumber}: key "${result.row.key}" is already used by row ${duplicateKey}. Keys must be unique.`
          : // Identity is title + date, so this is two rows with the same
            // title on the same day - genuinely ambiguous to a reader too.
            `Row ${rowNumber}: same title and date as row ${duplicateKey}, so the two cannot be told apart. Give one of them a more specific title.`,
      );
      continue;
    }
    seenKeys.set(result.row.key, rowNumber);

    // Only rows that will actually write a slug are checked against each
    // other. An existing event keeps the address it was created with, so its
    // newly-derived slug is not a claim on anything and must not make a
    // genuinely new row look like a duplicate.
    const claimsSlug =
      result.row.slugExplicit || !ownedByKey.has(result.row.key);

    if (claimsSlug) {
      // Two rows resolving to one web address: the second would be refused by
      // the database anyway, but saying so here names both rows.
      const duplicateSlug = seenSlugs.get(result.row.slug);
      if (duplicateSlug !== undefined) {
        problems.push(
          `Row ${rowNumber}: this would use the same web address as row ${duplicateSlug} (/events/${result.row.slug}). Give one of them a Slug.`,
        );
        continue;
      }
      seenSlugs.set(result.row.slug, rowNumber);
    }

    parsed.push(result.row);
  }

  let created = 0;
  let updated = 0;

  for (const row of parsed) {
    const existing = ownedByKey.get(row.key);
    const now = new Date();

    try {
      // Upsert rather than a plain insert or update: the cron run and the
      // button in /admin/events can overlap, and the unique key on
      // `sheet_row_key` is what keeps that from producing two events.
      await db
        .insert(events)
        .values({
          ...row.values,
          slug: row.slug,
          sheetRowKey: row.key,
          sheetSyncedAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: events.sheetRowKey,
          set: {
            ...row.values,
            // The web address is fixed when the event is first created, and a
            // retitle does not move it. /events/… links go out on Instagram,
            // in the mailing list and on printed posters long before the
            // evening; a sync that silently repointed them would break every
            // one of those, and 404s are the least recoverable thing this code
            // could do. Filling in the Slug column is how you ask for a move.
            ...(row.slugExplicit ? { slug: row.slug } : {}),
            sheetSyncedAt: now,
            updatedAt: now,
          },
        });

      if (existing) updated += 1;
      else created += 1;
    } catch (error) {
      // The slug is the other unique column. A collision here means the sheet
      // wants an address already held by an event it does not own - usually
      // one of the archive rows imported from a term card.
      if (isUniqueViolation(error)) {
        problems.push(
          `Row ${seenKeys.get(row.key)}: /events/${row.slug} is already taken by ` +
            "another event. Put a different value in the Slug column.",
        );
        continue;
      }
      throw error;
    }
  }

  // Rows that have left the sheet. Unpublished, never deleted - see the note
  // at the top of this file.
  const liveKeys = new Set(parsed.map((row) => row.key));
  const departed = owned.filter(
    (row) => row.key && !liveKeys.has(row.key) && row.published,
  );

  for (const row of departed) {
    await db
      .update(events)
      .set({ published: false, sheetSyncedAt: new Date(), updatedAt: new Date() })
      .where(eq(events.id, row.id));
  }

  return {
    // A run that read the sheet and applied it is a success even if some rows
    // were rejected - the problems are reported alongside, not instead.
    ok: true,
    rowsRead,
    created,
    updated,
    unpublished: departed.length,
    skipped: problems.length,
    problems,
    errorMessage: null,
  };
}

/**
 * Records the run for /admin/events, and prunes the history.
 *
 * Recorded in its own try/catch: if writing the audit row fails, the sync
 * itself still happened and the caller should hear about that, not about the
 * bookkeeping.
 */
async function recordRun({
  report,
  trigger,
  actorEmail,
  startedAt,
}: {
  report: SyncReport;
  trigger: SyncTrigger;
  actorEmail: string | null;
  startedAt: Date;
}): Promise<void> {
  try {
    const db = getDb();

    await db.insert(eventSyncRuns).values({
      trigger,
      triggeredByEmail: actorEmail,
      ok: report.ok,
      rowsRead: report.rowsRead,
      created: report.created,
      updated: report.updated,
      unpublished: report.unpublished,
      skipped: report.skipped,
      // Capped so one badly broken sheet cannot write a thousand-line row on
      // every run for the rest of the year.
      problems: report.problems.slice(0, 50),
      errorMessage: report.errorMessage,
      startedAt,
      finishedAt: new Date(),
    });

    // Four runs an hour is ~35,000 rows a year, and nobody reads past the last
    // few. Keep a fortnight's worth.
    await db.execute(sql`
      delete from ${eventSyncRuns}
      where ${eventSyncRuns.startedAt} < now() - interval '14 days'
    `);
  } catch (error) {
    console.error("Could not record the event sync run:", error);
  }
}
