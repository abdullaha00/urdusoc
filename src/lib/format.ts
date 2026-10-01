/**
 * Date and money formatting.
 *
 * The timezone is pinned to Europe/London everywhere. Vercel's servers run in
 * UTC, so without this an event at 7pm in October would render as 6pm.
 */

const TIME_ZONE = "Europe/London";

/**
 * "Friday, 23 October".
 *
 * Built from two formatters because en-GB omits the comma after the weekday
 * when no year is present, which would read inconsistently next to
 * `formatEventDateWithYear`.
 */
export function formatEventDate(date: Date): string {
  const weekday = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    timeZone: TIME_ZONE,
  }).format(date);

  const dayAndMonth = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
  }).format(date);

  return `${weekday}, ${dayAndMonth}`;
}

/**
 * "Fri 23 Oct" - the compact list in the hero, where the column is too narrow
 * for the long form above.
 */
export function formatEventDateShort(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
  }).format(date);
}

/** "Friday, 23 October 2026" - for events outside the current year. */
export function formatEventDateWithYear(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(date);
}

/** "7:00 PM" */
export function formatEventTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TIME_ZONE,
  })
    .format(date)
    .replace("am", "AM")
    .replace("pm", "PM");
}

/** "October 2026" - gallery and archive groupings. */
export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(date);
}

/** Machine-readable value for <time dateTime="…">. */
export function toDateTimeAttribute(date: Date): string {
  return date.toISOString();
}

/**
 * Date-only value for <time dateTime="…">, for events whose hour is unknown.
 *
 * The full ISO form asserts a start time to anything reading the markup, which
 * would be a claim we cannot support when the page itself shows only a date.
 * Uses the London calendar day, so an evening event never reports the day after.
 */
export function toDateAttribute(date: Date): string {
  const f = londonParts(date);
  const pad = (value: number, width = 2) => String(value).padStart(width, "0");
  return `${pad(f.year, 4)}-${pad(f.month)}-${pad(f.day)}`;
}

/** 0 → "Free", 500 → "£5", 750 → "£7.50" */
export function formatPrice(pence: number): string {
  if (pence <= 0) return "Free";
  const pounds = pence / 100;
  return Number.isInteger(pounds) ? `£${pounds}` : `£${pounds.toFixed(2)}`;
}

export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/* -------------------------------------------------------------------------- */
/* Admin form input <-> timestamptz                                            */
/* -------------------------------------------------------------------------- */

/**
 * The wall-clock fields Europe/London was showing at `instant`.
 *
 * `hourCycle: "h23"` matters: the default en-GB cycle renders midnight as 24,
 * which would push the date back a day when the parts are reassembled.
 */
function londonParts(instant: Date): Record<string, number> {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(instant);

  const fields: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") fields[part.type] = Number(part.value);
  }
  return fields;
}

/** Minutes Europe/London was ahead of UTC at `instant` - 0 in GMT, 60 in BST. */
function londonOffsetMinutes(instant: Date): number {
  const f = londonParts(instant);
  const asIfUtc = Date.UTC(f.year, f.month - 1, f.day, f.hour, f.minute, f.second);
  return (asIfUtc - instant.getTime()) / 60_000;
}

/**
 * Reads a `<input type="datetime-local">` value as a London wall-clock time.
 *
 * The browser sends a zoneless string like "2026-10-23T19:00". Passing that to
 * `new Date()` interprets it in the *server's* zone - UTC on Vercel - so an
 * October event entered as 7pm would be stored as 7pm UTC and shown as 8pm BST.
 * Returns null when the value is missing or malformed, so callers can validate.
 */
export function parseLondonDateTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    value.trim(),
  );
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  const naiveUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    second ? Number(second) : 0,
  );
  if (Number.isNaN(naiveUtc)) return null;

  // Two passes: the guess and the answer can sit on opposite sides of a clock
  // change, so the offset is re-read at the corrected instant.
  const firstGuess = naiveUtc - londonOffsetMinutes(new Date(naiveUtc)) * 60_000;
  const instant = naiveUtc - londonOffsetMinutes(new Date(firstGuess)) * 60_000;

  const parsed = new Date(instant);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Inverse of `parseLondonDateTime`, for populating an edit form. */
export function toDateTimeLocalValue(date: Date): string {
  const f = londonParts(date);
  const pad = (value: number, width = 2) => String(value).padStart(width, "0");
  return `${pad(f.year, 4)}-${pad(f.month)}-${pad(f.day)}T${pad(f.hour)}:${pad(f.minute)}`;
}
