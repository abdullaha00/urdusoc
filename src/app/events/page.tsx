import type { Metadata } from "next";
import Image from "next/image";
import { EventList, FeaturedList } from "@/components/event-postcard";
import { PageHeader, SectionLabel } from "@/components/ui";
import { termCards } from "@/lib/content";
import { groupEventsByTerm, splitFeatured } from "@/lib/events";
import { getPastEvents, getUpcomingEvents } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Mushairas, chai socials, workshops and talks from the Cambridge University Urdu Society.",
};

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(),
  ]);

  const { featured } = splitFeatured(upcoming);
  const now = new Date();
  const featuredTerms = groupEventsByTerm(featured, "ascending", now);
  const pastTerms = groupEventsByTerm(past, "descending", now);

  return (
    <>
      <PageHeader
        title="What's on this term."
        titleUrdu="محفل"
        intro="Everything we run is open to members and non-members alike."
      />

      {featured.length > 0 ? (
        <section className="border-b border-rule/70">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
            <SectionLabel as="h2" trailingRule className="text-ink-muted">
              Featured
            </SectionLabel>

            <div className="mt-10 space-y-14">
              {featuredTerms.map((term) => (
                <div key={term.label}>
                  <h3 className="font-serif text-2xl tracking-tight text-forest">
                    {term.label}
                  </h3>
                  <FeaturedList events={term.events} className="mt-6" />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* <section className="border-b border-rule/70">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <SectionLabel as="h2" trailingRule className="text-ink-muted">
            The programme
          </SectionLabel>

          {grid.length > 0 ? (
            <EventList events={grid} className="mt-10" />
          ) : (
            // Only speak when there is genuinely nothing more to show: the
            // featured list above may already be holding every upcoming
            // event, and an "everything is empty" line beneath it would
            // contradict what the reader can see.
            <p className="mt-10 max-w-md leading-relaxed text-ink-muted">
              {upcoming.length === 0
                ? "Nothing is scheduled at the moment. The term card usually goes up a week or two before term begins."
                : "That is everything upcoming - the whole term is in the list above."}
            </p>
          )}
        </div>
      </section> */}

      {past.length > 0 ? (
        <section className="bg-paper-deep">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
            <SectionLabel as="h2" trailingRule className="text-ink-muted">
              Past events
            </SectionLabel>

            <div className="mt-10 space-y-14">
              {pastTerms.map((term) => (
                <div key={term.label}>
                  <h3 className="font-serif text-2xl tracking-tight">
                    {term.label}
                  </h3>
                  <EventList events={term.events} muted className="mt-6" />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {termCards.length > 0 ? (
        <section className="border-t border-rule/70">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
            <SectionLabel as="h2" trailingRule className="text-ink-muted">
              Term cards
            </SectionLabel>

            {[...termCards].reverse().map((card) => (
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
