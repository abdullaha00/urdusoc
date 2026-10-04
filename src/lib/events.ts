/**
 * Presentation rules for events - category swatches and the featured/grid split.
 *
 * Kept apart from `queries.ts` because none of it touches the database: these
 * are decisions about how an event *reads*, and they are the same whether the
 * row came from Postgres or a test fixture.
 */

import type { Event } from "@/lib/db/schema";

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The colour axis for event cards.
 *
 * The swatches are muted on purpose - the brief asked for something closer to a
 * museum classification mark than a social-media tag, so these are pigments
 * (indigo, madder, verdigris) at low saturation rather than UI accent colours.
 *
 * Each doubles as the colour of its own label text, so each is dark enough to
 * clear WCAG AA on both palettes: the lightest measures 7.0:1 on the archive
 * ground and 5.4:1 on the sandier heritage one. Darken, never lighten, if you
 * retune them - see src/lib/palette.ts.
 */
export const EVENT_CATEGORIES = {
  academic: {
    label: "Academic",
    swatch: "#3a4763",
  },
  cultural: {
    label: "Cultural",
    swatch: "#733539",
  },
  social: {
    label: "Social",
    swatch: "#44594b",
  },
} as const;

export type EventCategory = keyof typeof EVENT_CATEGORIES;

/** "In collaboration with PakSoc and Majlis", or just "In collaboration". */
export function collaborationLine(event: Event): string | null {
  if (!event.isCollaboration) return null;

  const names = event.collaborators.filter((name) => name.trim().length > 0);
  if (names.length === 0) return "In collaboration";
  if (names.length === 1) return `In collaboration with ${names[0]}`;

  const last = names[names.length - 1];
  return `In collaboration with ${names.slice(0, -1).join(", ")} and ${last}`;
}

/* -------------------------------------------------------------------------- */
/* Academic terms                                                             */
/* -------------------------------------------------------------------------- */

const termDateFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "numeric",
  timeZone: "Europe/London",
  year: "numeric",
});

type TermOrder = "ascending" | "descending";

export type EventTermGroup<T> = {
  events: T[];
  label: string;
};

function academicTerm(date: Date): { label: string; sortKey: number } {
  const parts = termDateFormatter.formatToParts(date);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const year = Number(parts.find((part) => part.type === "year")?.value);

  if (month <= 3) return { label: `Lent ${year}`, sortKey: year * 4 };
  if (month <= 6) return { label: `Easter ${year}`, sortKey: year * 4 + 1 };
  if (month <= 9) {
    return { label: `Long Vacation ${year}`, sortKey: year * 4 + 2 };
  }

  return { label: `Michaelmas ${year}`, sortKey: year * 4 + 3 };
}

/**
 * Groups dated events by the Cambridge term in which they occur.
 *
 * Undated events use `undatedDate`, which puts TBC upcoming events in the
 * current term. Event order within each term is left untouched.
 */
export function groupEventsByTerm<T extends { startsAt: Date | null }>(
  events: T[],
  order: TermOrder,
  undatedDate = new Date(),
): EventTermGroup<T>[] {
  const groups = new Map<
    number,
    EventTermGroup<T> & { sortKey: number }
  >();

  for (const event of events) {
    const term = academicTerm(event.startsAt ?? undatedDate);
    const group = groups.get(term.sortKey);

    if (group) {
      group.events.push(event);
    } else {
      groups.set(term.sortKey, { ...term, events: [event] });
    }
  }

  return [...groups.values()]
    .sort((a, b) =>
      order === "ascending" ? a.sortKey - b.sortKey : b.sortKey - a.sortKey,
    )
    .map(({ events: groupedEvents, label }) => ({
      events: groupedEvents,
      label,
    }));
}

/* -------------------------------------------------------------------------- */
/* Featured / rest split                                                       */
/* -------------------------------------------------------------------------- */

/** How many events the featured list shows at most. */
export const FEATURED_LIMIT = 3;

/**
 * Splits upcoming events into the featured list and the programme below it.
 *
 * The brief's rules, in order:
 *   1. Manually featured events come first, highest `priority` first.
 *   2. If nothing is featured, fall back to the soonest upcoming events, so the
 *      section is never empty and a committee that never touches the flag still
 *      gets a sensible page.
 *   3. Whatever ends up featured is removed from the list below - no event appears
 *      twice on the page.
 *
 * `upcoming` is expected in chronological order (as `getUpcomingEvents`
 * returns it); ties in `priority` therefore stay chronological.
 */
export function splitFeatured(upcoming: Event[]): {
  featured: Event[];
  rest: Event[];
} {
  const flagged = upcoming
    .filter((event) => event.featured)
    .sort((a, b) => b.priority - a.priority);

  const featured =
    flagged.length > 0
      ? flagged.slice(0, FEATURED_LIMIT)
      : upcoming.slice(0, FEATURED_LIMIT);

  const featuredIds = new Set(featured.map((event) => event.id));

  return {
    featured,
    rest: upcoming.filter((event) => !featuredIds.has(event.id)),
  };
}
