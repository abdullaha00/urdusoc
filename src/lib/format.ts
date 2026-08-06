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

/** "Friday, 23 October 2026" — for events outside the current year. */
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

/** "October 2026" — gallery and archive groupings. */
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

/** 0 → "Free", 500 → "£5", 750 → "£7.50" */
export function formatPrice(pence: number): string {
  if (pence <= 0) return "Free";
  const pounds = pence / 100;
  return Number.isInteger(pounds) ? `£${pounds}` : `£${pounds.toFixed(2)}`;
}

export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}
