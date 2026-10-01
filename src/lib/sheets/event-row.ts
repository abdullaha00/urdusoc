/**
 * Turning a row of the committee's spreadsheet into an event.
 *
 * Everything here is written on the assumption that the person filling the
 * sheet in is a committee member with a term card and twenty minutes, not a
 * developer. So:
 *
 *   · columns are found by their heading, not their position, and the sheet
 *     may carry extra columns of the committee's own;
 *   · dates and times are read in the several spellings a person actually
 *     types, not one canonical form;
 *   · a bad row is reported by name and skipped, never allowed to fail the run.
 *
 * Which spreadsheet row is which database row is worked out from the title and
 * the date, so there is no bookkeeping column for the committee to maintain -
 * see `identityFor` below for what that costs.
 */

import { z } from "zod";
import {
  eventCategoryEnum,
  eventKindEnum,
  ticketingModeEnum,
} from "@/lib/db/schema";
import { parseLondonDateTime } from "@/lib/format";
import { slugify } from "@/lib/slug";

/* -------------------------------------------------------------------------- */
/* Columns                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Heading spellings we accept for each field, normalised.
 *
 * The first entry is the one documented in the README and written by
 * `npm run sheet:headers`; the rest are what people type instead.
 */
const COLUMN_ALIASES = {
  key: ["key", "id", "ref", "reference"],
  title: ["title", "event", "name"],
  titleUrdu: ["titleurdu", "urdutitle"],
  kind: ["kind", "type"],
  kindUrdu: ["kindurdu", "urdukind", "urdulabel"],
  category: ["category", "colour", "color"],
  summary: ["summary", "oneline", "blurb"],
  body: ["body", "description", "details", "longdescription"],
  date: ["date", "startdate", "day"],
  startTime: ["starttime", "time", "start"],
  endDate: ["enddate", "finishdate"],
  endTime: ["endtime", "end", "finish", "finishtime"],
  venue: ["venue", "location", "where", "room"],
  capacity: ["capacity", "places", "spaces", "limit"],
  ticketing: ["ticketing", "signup", "booking", "rsvp"],
  collaborators: ["collaborators", "cohosts", "with", "partners"],
  featured: ["featured", "highlight"],
  priority: ["priority", "order"],
  posterUrl: ["posterurl", "poster", "image", "posterlink"],
  posterAlt: ["posteralt", "posterdescription", "alttext"],
  instagramUrl: ["instagramurl", "instagram", "instagramlink", "post"],
  published: ["published", "live", "publish", "public"],
  slug: ["slug", "weburl", "url", "webaddress"],
} as const;

export type ColumnName = keyof typeof COLUMN_ALIASES;

/** Without these there is no event, so their absence fails the whole run. */
const REQUIRED_COLUMNS: ColumnName[] = ["title", "summary", "date"];

/** "Poster URL" and "poster_url" and "PosterUrl" are all the same heading. */
function normaliseHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export type ColumnMap = Partial<Record<ColumnName, number>>;

/**
 * Locates each known column in the header row.
 *
 * Returns the missing *required* headings rather than throwing, so the caller
 * can report all of them at once - a committee that has renamed two columns
 * should learn about both on the first run, not one per attempt.
 */
export function mapColumns(headerRow: string[]): {
  columns: ColumnMap;
  missing: ColumnName[];
} {
  const seen = new Map<string, number>();
  headerRow.forEach((heading, index) => {
    const key = normaliseHeader(heading ?? "");
    // First occurrence wins, so a stray duplicate heading further right does
    // not silently take over from the real column.
    if (key && !seen.has(key)) seen.set(key, index);
  });

  const columns: ColumnMap = {};
  for (const [name, aliases] of Object.entries(COLUMN_ALIASES) as [
    ColumnName,
    readonly string[],
  ][]) {
    for (const alias of aliases) {
      const index = seen.get(alias);
      if (index !== undefined) {
        columns[name] = index;
        break;
      }
    }
  }

  return {
    columns,
    missing: REQUIRED_COLUMNS.filter((name) => columns[name] === undefined),
  };
}

/**
 * A cell's contents, or "".
 *
 * The API omits trailing empty cells entirely, so a row whose last four columns
 * are blank simply arrives short. Indexing past the end must be "" rather than
 * undefined, or every downstream `.trim()` throws.
 */
function cellAt(row: string[], index: number | undefined): string {
  if (index === undefined) return "";
  return (row[index] ?? "").toString().trim();
}

/** True when the row is entirely blank - a spacer, or the end of the data. */
export function isBlankRow(row: string[]): boolean {
  return row.every((cell) => !(cell ?? "").toString().trim());
}

/* -------------------------------------------------------------------------- */
/* Dates, times and other spreadsheet spellings                                */
/* -------------------------------------------------------------------------- */

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

function pad(value: number, width = 2): string {
  return String(value).padStart(width, "0");
}

/**
 * A calendar date as "YYYY-MM-DD", from the forms people actually type.
 *
 * Numeric dates are read **day-first** - "05/06/2026" is 5 June, not 5 May.
 * This is a Cambridge society and the sheet's locale is en-GB; guessing per row
 * would be worse than one documented rule. The README says so in as many words.
 */
export function parseSheetDate(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  // 2026-10-23 and 2026/10/23 - unambiguous, so checked first.
  const iso = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(value);
  if (iso) {
    return validCalendarDate(+iso[1], +iso[2], +iso[3]);
  }

  // 23/10/2026, 23-10-2026, 23.10.26
  const dayFirst = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/.exec(value);
  if (dayFirst) {
    const year = +dayFirst[3];
    return validCalendarDate(
      year < 100 ? 2000 + year : year,
      +dayFirst[2],
      +dayFirst[1],
    );
  }

  // 23 October 2026, 23 Oct 2026, Friday 23 October 2026, 23 Oct 26
  const named =
    /^(?:[a-z]+,?\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\.?\s+(\d{2}|\d{4})$/i.exec(
      value,
    );
  if (named) {
    const monthIndex = MONTHS.findIndex((month) =>
      month.startsWith(named[2].toLowerCase()),
    );
    if (monthIndex === -1) return null;
    const year = +named[3];
    return validCalendarDate(
      year < 100 ? 2000 + year : year,
      monthIndex + 1,
      +named[1],
    );
  }

  return null;
}

/**
 * Rejects a date that parsed but does not exist - 31 February, month 13.
 *
 * Without this, `Date.UTC` silently rolls over and a typo becomes a real event
 * on the wrong day, which is much harder to notice than a reported error.
 */
function validCalendarDate(
  year: number,
  month: number,
  day: number,
): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

/** A wall-clock time as "HH:mm", from "19:00", "7:00 pm", "7pm", "7.30pm". */
export function parseSheetTime(input: string): string | null {
  const value = input.trim().toLowerCase();
  if (!value) return null;

  const match = /^(\d{1,2})(?:[:.](\d{2}))?(?::\d{2})?\s*(am|pm)?$/.exec(value);
  if (!match) return null;

  let hour = +match[1];
  const minute = match[2] ? +match[2] : 0;
  const meridiem = match[3];

  if (minute > 59) return null;

  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === "pm" && hour !== 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
  } else if (hour > 23) {
    return null;
  }

  return `${pad(hour)}:${pad(minute)}`;
}

/**
 * A tick-box column. Blank is false.
 *
 * "✓" and "x" are both here because both are what people put in a column
 * headed "Featured", and they mean the same thing despite "x" reading like a
 * negation elsewhere. A cell nobody has touched is false, which is the safe
 * default for `published`.
 */
function parseSheetBoolean(input: string): boolean {
  const value = input.trim().toLowerCase();
  return ["yes", "y", "true", "1", "✓", "✔", "x", "live", "published"].includes(
    value,
  );
}

/* -------------------------------------------------------------------------- */
/* The row schema                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Paid ticketing has no payment provider behind it - the admin action refuses
 * it too, for the same reason. Allowing it from the sheet would publish an
 * event with a price nobody can pay.
 *
 * Written out rather than filtered from the enum so the accepted values keep
 * their literal types; `satisfies` still fails the build if one of them stops
 * being a real ticketing mode.
 */
const SHEET_TICKETING = ["none", "rsvp"] as const satisfies readonly Exclude<
  (typeof ticketingModeEnum.enumValues)[number],
  "paid"
>[];

const enumFrom = <T extends readonly [string, ...string[]]>(
  values: T,
  fallback: T[number],
  label: string,
) =>
  z
    .string()
    .trim()
    .transform((value) => value.toLowerCase())
    .transform((value, ctx) => {
      if (!value) return fallback;
      if ((values as readonly string[]).includes(value)) {
        return value as T[number];
      }
      ctx.addIssue({
        code: "custom",
        message: `${label} must be one of ${values.join(", ")} - got "${value}".`,
      });
      return z.NEVER;
    });

const rowSchema = z
  .object({
    // Optional, and absent from the default heading row. See `identityFor`.
    key: z
      .string()
      .trim()
      .max(80, "Key is too long - keep it short, like 'mushaira-mich-1'.")
      .transform((v) => v || null),
    title: z.string().trim().min(1, "Title is blank.").max(200),
    titleUrdu: z.string().trim().max(200).transform((v) => v || null),
    kind: enumFrom(eventKindEnum.enumValues, "mushaira", "Kind"),
    kindUrdu: z.string().trim().max(60).transform((v) => v || null),
    category: enumFrom(eventCategoryEnum.enumValues, "cultural", "Category"),
    summary: z
      .string()
      .trim()
      .min(1, "Summary is blank - one sentence for the event card.")
      .max(300, "Summary is over 300 characters; it is used on a small card."),
    body: z.string().trim().max(20000).transform((v) => v || null),
    date: z
      .string()
      .trim()
      .min(1, "Date is blank.")
      .transform((value, ctx) => {
        const parsed = parseSheetDate(value);
        if (!parsed) {
          ctx.addIssue({
            code: "custom",
            message: `Date "${value}" is not one we can read. Use 2026-10-23, 23/10/2026 or 23 October 2026.`,
          });
          return z.NEVER;
        }
        return parsed;
      }),
    startTime: z.string().trim().transform((value, ctx) => {
      if (!value) return null;
      const parsed = parseSheetTime(value);
      if (!parsed) {
        ctx.addIssue({
          code: "custom",
          message: `Start time "${value}" is not one we can read. Use 19:00 or 7pm.`,
        });
        return z.NEVER;
      }
      return parsed;
    }),
    endDate: z.string().trim().transform((value, ctx) => {
      if (!value) return null;
      const parsed = parseSheetDate(value);
      if (!parsed) {
        ctx.addIssue({
          code: "custom",
          message: `End date "${value}" is not one we can read.`,
        });
        return z.NEVER;
      }
      return parsed;
    }),
    endTime: z.string().trim().transform((value, ctx) => {
      if (!value) return null;
      const parsed = parseSheetTime(value);
      if (!parsed) {
        ctx.addIssue({
          code: "custom",
          message: `End time "${value}" is not one we can read. Use 21:00 or 9pm.`,
        });
        return z.NEVER;
      }
      return parsed;
    }),
    venue: z.string().trim().max(200).transform((v) => v || null),
    capacity: z
      .string()
      .trim()
      .transform((value, ctx) => {
        if (!value) return null;
        // "30 people" and "30" both mean thirty; a comma'd thousand does too.
        const digits = value.replace(/[,\s]/g, "").match(/^\d+/);
        const parsed = digits ? Number(digits[0]) : Number.NaN;
        if (!Number.isInteger(parsed) || parsed <= 0) {
          ctx.addIssue({
            code: "custom",
            message: `Capacity "${value}" is not a whole number. Leave it blank for uncapped.`,
          });
          return z.NEVER;
        }
        return parsed;
      }),
    ticketing: enumFrom(SHEET_TICKETING, "none", "Ticketing"),
    collaborators: z
      .string()
      .trim()
      .transform((value) =>
        value
          .split(/[,;]/)
          .map((name) => name.trim())
          .filter((name) => name.length > 0),
      ),
    featured: z.string().transform(parseSheetBoolean),
    priority: z
      .string()
      .trim()
      .transform((value, ctx) => {
        if (!value) return 0;
        const parsed = Number(value);
        if (!Number.isInteger(parsed)) {
          ctx.addIssue({
            code: "custom",
            message: `Priority "${value}" is not a whole number.`,
          });
          return z.NEVER;
        }
        return parsed;
      }),
    posterUrl: z
      .string()
      .trim()
      .max(500)
      .transform((value, ctx) => {
        if (!value) return null;
        if (!/^https:\/\//i.test(value)) {
          ctx.addIssue({
            code: "custom",
            message:
              "Poster URL must start with https:// - a Google Drive share link will not display; upload the poster in /admin/gallery and paste that address.",
          });
          return z.NEVER;
        }
        return value;
      }),
    posterAlt: z.string().trim().max(300).transform((v) => v || null),
    instagramUrl: z
      .string()
      .trim()
      .max(500)
      .transform((value, ctx) => {
        if (!value) return null;

        let host: string;
        try {
          host = new URL(value).hostname;
        } catch {
          ctx.addIssue({
            code: "custom",
            message: `Instagram link "${value}" is not a valid web address.`,
          });
          return z.NEVER;
        }

        if (!["instagram.com", "www.instagram.com"].includes(host)) {
          ctx.addIssue({
            code: "custom",
            message:
              "Instagram link must be an instagram.com address - paste the post's own link, not a screenshot or a share sheet.",
          });
          return z.NEVER;
        }

        return value;
      }),
    published: z.string().transform(parseSheetBoolean),
    slug: z.string().trim().max(120).transform((v) => v || null),
  })
  // Same rule the admin form enforces: a poster nobody can describe is
  // unreachable for anyone using a screen reader.
  .refine((row) => row.posterUrl === null || row.posterAlt !== null, {
    message: "Poster URL is set but Poster alt is blank. Describe the poster.",
  })
  .refine((row) => row.endTime === null || row.startTime !== null, {
    message: "End time is set but start time is blank.",
  });

/**
 * What ties a spreadsheet row to a database row: its title and its date.
 *
 * Derived rather than typed, so there is no bookkeeping column to maintain and
 * nothing to get wrong. Crucially it is *not* the row's position - a
 * spreadsheet guarantees nothing about that, and sorting by date is the first
 * thing anyone does. A positional key would hand one event's database row, and
 * eventually its door list, to whichever event sorted into its place.
 *
 * The cost, which is real and is documented in the README: **editing a title
 * or a date makes a different event.** The old one is unpublished and left
 * behind, and a new one appears at a new address. Fixing a typo in a title is
 * therefore not a small edit. Two ways out when that matters:
 *
 *   · add a `Slug` column to pin the web address, so at least links survive;
 *   · add a `Key` column and put a word in it, which pins identity outright
 *     and makes retitling a plain update. It is not in the default heading
 *     row, but it is still read when present - it is the way back if the
 *     committee ever turns bookings on and cannot afford an orphaned row.
 */
function identityFor(title: string, isoDate: string): string {
  return `${slugify(title, "event")}-${isoDate}`;
}

export type ParsedEventRow = {
  key: string;
  /** True when a `Key` column supplied it, rather than title + date. */
  keyExplicit: boolean;
  slug: string;
  /**
   * True when the Slug column was filled in, rather than the slug being
   * derived from the title. The sync only overwrites an existing event's web
   * address when this is set - see the note where it is read.
   */
  slugExplicit: boolean;
  values: {
    title: string;
    titleUrdu: string | null;
    kind: (typeof eventKindEnum.enumValues)[number];
    kindUrdu: string | null;
    category: (typeof eventCategoryEnum.enumValues)[number];
    isCollaboration: boolean;
    collaborators: string[];
    summary: string;
    body: string | null;
    startsAt: Date;
    endsAt: Date | null;
    showTime: boolean;
    venue: string | null;
    capacity: number | null;
    ticketing: (typeof ticketingModeEnum.enumValues)[number];
    pricePence: number;
    featured: boolean;
    priority: number;
    posterUrl: string | null;
    posterAlt: string | null;
    instagramUrl: string | null;
    published: boolean;
  };
};

export type RowResult =
  | { ok: true; row: ParsedEventRow }
  | { ok: false; problems: string[] };

/**
 * Validates one data row.
 *
 * `rowNumber` is the spreadsheet's own 1-based row number, so a problem reads
 * "Row 14: …" and the committee can go straight to it.
 */
export function parseEventRow(
  row: string[],
  columns: ColumnMap,
  rowNumber: number,
): RowResult {
  const raw = {
    key: cellAt(row, columns.key),
    title: cellAt(row, columns.title),
    titleUrdu: cellAt(row, columns.titleUrdu),
    kind: cellAt(row, columns.kind),
    kindUrdu: cellAt(row, columns.kindUrdu),
    category: cellAt(row, columns.category),
    summary: cellAt(row, columns.summary),
    body: cellAt(row, columns.body),
    date: cellAt(row, columns.date),
    startTime: cellAt(row, columns.startTime),
    endDate: cellAt(row, columns.endDate),
    endTime: cellAt(row, columns.endTime),
    venue: cellAt(row, columns.venue),
    capacity: cellAt(row, columns.capacity),
    ticketing: cellAt(row, columns.ticketing),
    collaborators: cellAt(row, columns.collaborators),
    featured: cellAt(row, columns.featured),
    priority: cellAt(row, columns.priority),
    posterUrl: cellAt(row, columns.posterUrl),
    posterAlt: cellAt(row, columns.posterAlt),
    instagramUrl: cellAt(row, columns.instagramUrl),
    published: cellAt(row, columns.published),
    slug: cellAt(row, columns.slug),
  };

  const parsed = rowSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      problems: parsed.error.issues.map(
        (issue) => `Row ${rowNumber}: ${issue.message}`,
      ),
    };
  }

  const data = parsed.data;

  // No start time means the hour was never fixed. Midday is stored so the row
  // sorts onto the right calendar day in any timezone, and `showTime` tells the
  // site to print the date alone - the same convention db:import-events uses.
  const showTime = data.startTime !== null;
  const startsAt = parseLondonDateTime(
    `${data.date}T${data.startTime ?? "12:00"}`,
  );
  if (!startsAt) {
    return {
      ok: false,
      problems: [`Row ${rowNumber}: could not read "${data.date}" as a date.`],
    };
  }

  let endsAt: Date | null = null;
  if (data.endTime) {
    const endDate = data.endDate ?? data.date;
    endsAt = parseLondonDateTime(`${endDate}T${data.endTime}`);
    if (!endsAt) {
      return {
        ok: false,
        problems: [`Row ${rowNumber}: could not read the end date and time.`],
      };
    }
    // An evening that runs past midnight is written "21:00" to "01:00" with no
    // end date, which would otherwise land eight hours before it started.
    if (endsAt <= startsAt && !data.endDate) {
      endsAt = new Date(endsAt.getTime() + 24 * 60 * 60 * 1000);
    }
    if (endsAt <= startsAt) {
      return {
        ok: false,
        problems: [`Row ${rowNumber}: the end time is before the start.`],
      };
    }
  }

  // Carries the date because titles repeat across terms - two "Chai and
  // Chat!", two iftar potlucks. Without it the second would collide with the
  // first and be reported as a duplicate every single run.
  const identity = identityFor(data.title, data.date);

  const slug = data.slug ? slugify(data.slug, "event") : identity;

  return {
    ok: true,
    row: {
      key: data.key ?? identity,
      keyExplicit: data.key !== null,
      slug,
      slugExplicit: data.slug !== null,
      values: {
        title: data.title,
        titleUrdu: data.titleUrdu,
        kind: data.kind,
        kindUrdu: data.kindUrdu,
        category: data.category,
        // Co-hosting is inferred from the column rather than asking the
        // committee to keep a tick-box and a list of names in agreement.
        isCollaboration: data.collaborators.length > 0,
        collaborators: data.collaborators,
        summary: data.summary,
        body: data.body,
        startsAt,
        endsAt,
        showTime,
        venue: data.venue,
        capacity: data.capacity,
        ticketing: data.ticketing,
        pricePence: 0,
        featured: data.featured,
        priority: data.featured ? data.priority : 0,
        posterUrl: data.posterUrl,
        posterAlt: data.posterUrl ? data.posterAlt : null,
        instagramUrl: data.instagramUrl,
        published: data.published,
      },
    },
  };
}

/**
 * The heading row `npm run sheet:headers` prints - enough for a term card and
 * nothing else.
 *
 * Every other column in `COLUMN_ALIASES` still works if a committee adds it;
 * they are listed in the README under the columns you can add later. Two are
 * worth knowing about from the start:
 *
 *   · leaving `Ticketing` and `Capacity` out means no bookings and no cap,
 *     which is the intended default;
 *   · `Published` must stay. It defaults to false, so a sheet without that
 *     column publishes nothing at all.
 */
export const CANONICAL_HEADERS: string[] = [
  "Title",
  "Summary",
  "Date",
  "Start time",
  "Venue",
  "Kind",
  "Category",
  "Published",
];
