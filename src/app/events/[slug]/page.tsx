import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RsvpForm } from "@/components/rsvp-form";
import { ButtonLink, Diamond, SectionLabel, Urdu } from "@/components/ui";
import { EXTERNAL_LINKS, society } from "@/lib/content";
import {
  formatEventDateWithYear,
  formatEventTime,
  formatPrice,
  isPast,
  toDateTimeAttribute,
} from "@/lib/format";
import { getEventAvailability, getEventBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) return { title: "Event not found" };

  return {
    title: event.title,
    description: event.summary,
    openGraph: {
      title: event.title,
      description: event.summary,
      type: "article",
    },
  };
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) notFound();

  const availability = await getEventAvailability(event);
  const hasHappened = isPast(event.startsAt);

  const details = [
    { term: "Date", value: formatEventDateWithYear(event.startsAt) },
    { term: "Time", value: formatEventTime(event.startsAt) },
    { term: "Venue", value: event.venue },
    {
      term: "Admission",
      value:
        event.ticketing === "paid" ? formatPrice(event.pricePence) : "Free",
    },
  ];

  return (
    <>
      {/* Search engines show this as a proper event listing. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            name: event.title,
            startDate: event.startsAt.toISOString(),
            ...(event.endsAt ? { endDate: event.endsAt.toISOString() } : {}),
            eventStatus: "https://schema.org/EventScheduled",
            eventAttendanceMode:
              "https://schema.org/OfflineEventAttendanceMode",
            location: {
              "@type": "Place",
              name: event.venue,
              address: "Cambridge, United Kingdom",
            },
            description: event.summary,
            organizer: { "@type": "Organization", name: society.name },
          }),
        }}
      />

      <section className="paper-wash border-b border-rule/70">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <SectionLabel className="text-ink-muted">{event.kind}</SectionLabel>

          {event.kindUrdu ? (
            <Urdu className="mt-6 inline-block text-4xl leading-[1.6] text-forest sm:text-5xl">
              {event.kindUrdu}
            </Urdu>
          ) : null}

          <h1 className="mt-2 max-w-3xl font-serif text-4xl leading-[1.1] tracking-tight text-balance sm:text-5xl">
            {event.title}
          </h1>

          <p className="mt-6 max-w-xl leading-relaxed text-ink-muted">
            {event.summary}
          </p>

          <dl className="mt-10 grid gap-px border-y border-rule sm:grid-cols-4 sm:divide-x sm:divide-rule">
            {details.map(({ term, value }) => (
              <div
                key={term}
                className="py-4 sm:px-5 sm:first:pl-0 sm:last:pr-0"
              >
                <dt className="text-[0.62rem] tracking-[0.25em] text-ink-muted uppercase">
                  {term}
                </dt>
                <dd className="mt-2 text-sm text-ink">
                  {term === "Date" ? (
                    <time dateTime={toDateTimeAttribute(event.startsAt)}>
                      {value}
                    </time>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-b border-rule/70">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:py-20">
          <div>
            {event.body ? (
              <div className="max-w-xl space-y-5 leading-relaxed text-ink">
                {event.body
                  .split("\n\n")
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean)
                  .map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
              </div>
            ) : null}

            <div className="mt-10 flex items-center gap-3">
              <span aria-hidden className="h-px w-10 bg-rule" />
              <Diamond className="opacity-70" />
            </div>

            <p className="mt-6 max-w-md text-sm leading-relaxed text-ink-muted">
              Everything we run is open to everyone — members and non-members,
              fluent speakers and complete beginners. If you have a question
              before coming, message us on{" "}
              <a
                href={EXTERNAL_LINKS.instagram}
                className="underline decoration-gold/50 underline-offset-4 transition-colors hover:decoration-gold"
              >
                Instagram
              </a>
              .
            </p>
          </div>

          <div className="lg:border-l lg:border-rule lg:pl-16">
            <SectionLabel as="h2" className="text-ink-muted">
              {hasHappened ? "This event has passed" : "Book a place"}
            </SectionLabel>

            <div className="mt-8">
              {hasHappened ? (
                <div>
                  <p className="leading-relaxed text-ink-muted">
                    This one is over — photographs usually go up in the gallery a
                    week or two afterwards.
                  </p>
                  <ButtonLink href="/events" variant="outline" className="mt-6">
                    See what&rsquo;s next
                  </ButtonLink>
                </div>
              ) : event.ticketing === "rsvp" ? (
                availability.soldOut ? (
                  <div>
                    <p className="leading-relaxed text-ink-muted">
                      Every place has gone. Join the mailing list and we will
                      tell you the moment the next one is announced.
                    </p>
                    <ButtonLink href="/join" className="mt-6">
                      Join UrduSoc
                    </ButtonLink>
                  </div>
                ) : (
                  <RsvpForm slug={event.slug} remaining={availability.remaining} />
                )
              ) : event.ticketing === "paid" ? (
                <div>
                  <p className="leading-relaxed text-ink-muted">
                    Tickets are {formatPrice(event.pricePence)}. Booking opens
                    here shortly — in the meantime, message us on Instagram to
                    reserve a place.
                  </p>
                  <ButtonLink
                    href={EXTERNAL_LINKS.instagram}
                    variant="outline"
                    className="mt-6"
                  >
                    Message us
                  </ButtonLink>
                </div>
              ) : (
                <div>
                  <p className="leading-relaxed text-ink-muted">
                    No booking needed — just turn up. Doors open a little before
                    we start.
                  </p>
                  <ButtonLink href="/join" variant="outline" className="mt-6">
                    Join the mailing list
                  </ButtonLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
