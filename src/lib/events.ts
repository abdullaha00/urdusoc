/**
 * Presentation rules for events — the category legend, the swatch colours, and
 * the featured/grid split.
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
 * The colour axis, as printed in the legend on /events.
 *
 * The swatches are muted on purpose — the brief asked for something closer to a
 * museum classification mark than a social-media tag, so these are pigments
 * (indigo, madder, verdigris) at low saturation rather than UI accent colours.
 *
 * Each doubles as the colour of its own label text, so each is dark enough to
 * clear WCAG AA on both palettes: the lightest measures 7.0:1 on the archive
 * ground and 5.4:1 on the sandier heritage one. Darken, never lighten, if you
 * retune them — see src/lib/palette.ts.
 */
export const EVENT_CATEGORIES = {
  academic: {
    label: "Academic",
    description:
      "Lectures, discussions, language sessions and workshops — evenings that teach.",
    swatch: "#3a4763",
  },
  cultural: {
    label: "Cultural",
    description:
      "Mushairas, performances and celebrations — evenings that perform.",
    swatch: "#733539",
  },
  social: {
    label: "Social",
    description: "Chai, dinners and gatherings — evenings that simply meet.",
    swatch: "#44594b",
  },
} as const;

export type EventCategory = keyof typeof EVENT_CATEGORIES;

/**
 * The hosting axis, which is independent of category and so has no colour of
 * its own — it is marked on a card by a rule and a line of text, not a swatch.
 */
export const HOSTING_LEGEND = [
  {
    label: "Collaboration",
    description:
      "Held jointly with another society, organisation or institution.",
  },
  {
    label: "Standalone",
    description: "Organised by the Urdu Society alone.",
  },
] as const;

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
/* Filtering                                                                   */
/* -------------------------------------------------------------------------- */

/** The filters offered above the grid on /events. */
export const EVENT_FILTERS = [
  { id: "all", label: "All" },
  { id: "academic", label: "Academic" },
  { id: "cultural", label: "Cultural" },
  { id: "social", label: "Social" },
  { id: "collaboration", label: "Collaborations" },
] as const;

export type EventFilter = (typeof EVENT_FILTERS)[number]["id"];

export function isEventFilter(value: string | undefined): value is EventFilter {
  return EVENT_FILTERS.some((filter) => filter.id === value);
}

export function matchesFilter(event: Event, filter: EventFilter): boolean {
  if (filter === "all") return true;
  if (filter === "collaboration") return event.isCollaboration;
  return event.category === filter;
}

/* -------------------------------------------------------------------------- */
/* Featured / grid split                                                       */
/* -------------------------------------------------------------------------- */

/** How many events the carousel shows at most. */
export const FEATURED_LIMIT = 3;

/**
 * Splits upcoming events into the carousel and the grid below it.
 *
 * The brief's rules, in order:
 *   1. Manually featured events come first, highest `priority` first.
 *   2. If nothing is featured, fall back to the soonest upcoming events, so the
 *      section is never empty and a committee that never touches the flag still
 *      gets a sensible page.
 *   3. Whatever ends up featured is removed from the grid — no event appears
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
