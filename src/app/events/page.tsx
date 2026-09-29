import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EventLegend } from "@/components/event-legend";
import { EventPostcard } from "@/components/event-postcard";
import { FeaturedEvents } from "@/components/featured-events";
import { PageHeader, SectionLabel } from "@/components/ui";
import { termCards } from "@/lib/content";
import {
  EVENT_FILTERS,
  isEventFilter,
  matchesFilter,
  splitFeatured,
  type EventFilter,
} from "@/lib/events";
import { getPastEvents, getUpcomingEvents } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Mushairas, chai socials, workshops and talks from the Cambridge University Urdu Society.",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: rawFilter } = await searchParams;
  const filter: EventFilter = isEventFilter(rawFilter) ? rawFilter : "all";

  const [upcoming, past] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(),
  ]);

  // The filter narrows the programme first, and the featured/grid split is
  // taken from what survives. Splitting first and filtering only the grid
  // would let the carousel show an event the active filter had just excluded
  // from the grid — the page would contradict itself.
  const upcomingFiltered = upcoming.filter((event) =>
    matchesFilter(event, filter),
  );
  const { featured, rest: grid } = splitFeatured(upcomingFiltered);
  const pastFiltered = past.filter((event) => matchesFilter(event, filter));

  return (
    <>
      <PageHeader
        label="Term card"
        title="What's on this term."
        titleUrdu="محفل"
        intro="Everything we run is open to members and non-members alike. Most evenings are free; where a ticket is needed, it is there to cover the room and the chai."
      />

      {featured.length > 0 ? (
        <section className="border-b border-rule/70">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
            <SectionLabel as="h2" trailingRule className="text-ink-muted">
              Featured
            </SectionLabel>
            <div className="mt-10">
              <FeaturedEvents events={featured} />
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-b border-rule/70">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <SectionLabel as="h2" trailingRule className="text-ink-muted">
            {featured.length > 0 ? "The rest of the programme" : "Upcoming"}
          </SectionLabel>

          <div className="mt-10">
            <EventLegend />
          </div>

          <FilterBar active={filter} />

          {grid.length > 0 ? (
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {grid.map((event) => (
                <li key={event.id}>
                  <EventPostcard event={event} />
                </li>
              ))}
            </ul>
          ) : (
            // Only speak when there is genuinely nothing more to show. With a
            // filter on, the carousel above may already be holding everything
            // that matched, and an "everything is empty" line beneath it would
            // contradict what the reader can see.
            <p className="mt-10 max-w-md leading-relaxed text-ink-muted">
              {upcoming.length === 0
                ? "Nothing is scheduled at the moment. The term card usually goes up a week or two before term begins."
                : featured.length > 0
                  ? "That is everything upcoming under this filter."
                  : "Nothing upcoming under this filter. Try another, or see everything below."}
            </p>
          )}
        </div>
      </section>

      {pastFiltered.length > 0 ? (
        <section className="bg-paper-deep">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
            <SectionLabel as="h2" trailingRule className="text-ink-muted">
              Historic favourites
            </SectionLabel>

            <p className="mt-6 max-w-xl leading-relaxed text-ink-muted">
              Evenings we have already held. Kept here because the programme is
              also a record of what this society has been.
            </p>

            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pastFiltered.map((event) => (
                <li key={event.id}>
                  <EventPostcard event={event} muted />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {termCards.length > 0 ? (
        <section className="border-t border-rule/70">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
            <SectionLabel as="h2" trailingRule className="text-ink-muted">
              Term cards
            </SectionLabel>

            <p className="mt-6 max-w-xl leading-relaxed text-ink-muted">
              The card we print each term, kept as an archive. A few of these
              evenings never got a fixed date, so the card is the only record of
              them.
            </p>

            {termCards.map((card) => (
              <div key={card.term} className="mt-12">
                <h3 className="font-serif text-2xl tracking-tight">
                  {card.term}
                </h3>

                {/* Sized by column width with height following, since the two
                    terms' cards are different shapes. */}
                <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {card.images.map((image) => (
                    <li key={image.src}>
                      <a
                        href={image.src}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-sm border border-rule shadow-paper transition-colors duration-200 hover:border-gold"
                      >
                        <Image
                          src={image.src}
                          alt={image.alt}
                          width={image.width}
                          height={image.height}
                          sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 90vw"
                          className="h-auto w-full"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

/**
 * Filters as links rather than buttons, so each view has its own URL, works
 * without JavaScript, and can be shared or bookmarked.
 */
function FilterBar({ active }: { active: EventFilter }) {
  return (
    <nav aria-label="Filter events" className="mt-10">
      <ul className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {EVENT_FILTERS.map((filter) => {
          const isActive = filter.id === active;
          return (
            <li key={filter.id}>
              <Link
                href={filter.id === "all" ? "/events" : `/events?filter=${filter.id}`}
                aria-current={isActive ? "true" : undefined}
                className={`inline-flex rounded-full border px-4 py-1.5 text-xs tracking-[0.12em] uppercase transition-colors duration-200 ${
                  isActive
                    ? "border-forest bg-forest text-paper"
                    : "border-rule text-ink-muted hover:border-forest hover:text-forest"
                }`}
              >
                {filter.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
