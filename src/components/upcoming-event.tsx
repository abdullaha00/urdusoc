import type { Event } from "@/lib/db/schema";
import {
  formatEventDate,
  formatEventTime,
  formatPrice,
  toDateTimeAttribute,
} from "@/lib/format";
import { ButtonLink, Diamond, SectionLabel, Urdu } from "@/components/ui";

export function UpcomingEvent({ event }: { event: Event | null }) {
  return (
    <section id="events" className="border-b border-rule/70">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
        <SectionLabel trailingRule className="text-ink-muted">
          Upcoming event
        </SectionLabel>

        {event ? <EventPanel event={event} /> : <NoEventPlanned />}
      </div>
    </section>
  );
}

function EventPanel({ event }: { event: Event }) {
  // Unknown time or venue drops the row rather than showing it empty.
  const details = [
    { term: "Date", value: formatEventDate(event.startsAt) },
    event.showTime
      ? { term: "Time", value: formatEventTime(event.startsAt) }
      : null,
    event.venue ? { term: "Venue", value: event.venue } : null,
  ].filter((row) => row !== null);

  return (
    <div className="mt-10 grid overflow-hidden rounded-sm border border-forest/15 shadow-paper md:grid-cols-[0.8fr_1.2fr]">
      <div className="relative flex flex-col justify-between overflow-hidden bg-forest px-8 py-10 text-paper sm:px-10">
        <div
          aria-hidden
          className="absolute -top-16 -right-16 size-64 rounded-full bg-gold/15 blur-2xl"
        />
        <div aria-hidden className="ruled absolute inset-0 opacity-15" />

        <p className="relative text-[0.7rem] font-medium tracking-[0.28em] text-gold-light uppercase">
          {event.kind}
        </p>

        {event.kindUrdu ? (
          <span className="relative my-8 block">
            <Urdu className="inline-block text-6xl leading-[1.5] text-gold sm:text-7xl">
              {event.kindUrdu}
            </Urdu>
          </span>
        ) : (
          <span className="relative my-8 block" />
        )}

        <div className="relative flex items-center gap-3">
          <span aria-hidden className="h-px w-10 bg-paper/30" />
          <Diamond className="bg-gold/80" />
        </div>
      </div>

      <div className="bg-paper px-8 py-10 sm:px-10 lg:px-12 lg:py-12">
        <h2 className="font-serif text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
          {event.title}
        </h2>

        <p className="mt-4 max-w-md leading-relaxed text-ink-muted">
          {event.summary}
        </p>

        <dl className="mt-8 grid divide-y divide-rule border-y border-rule sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {details.map(({ term, value }) => (
            <div key={term} className="py-4 sm:px-5 sm:first:pl-0 sm:last:pr-0">
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

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <ButtonLink href={`/events/${event.slug}`}>View event</ButtonLink>
          {event.ticketing === "paid" ? (
            <span className="text-sm text-ink-muted">
              {formatPrice(event.pricePence)} · booking required
            </span>
          ) : null}
          {event.ticketing === "rsvp" ? (
            <span className="text-sm text-ink-muted">Free · please RSVP</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Shown between terms, when nothing is in the diary yet. */
function NoEventPlanned() {
  return (
    <div className="mt-10 rounded-sm border border-rule bg-paper-deep/50 px-8 py-14 text-center sm:py-16">
      <Urdu className="text-4xl text-forest sm:text-5xl">محفل</Urdu>
      <p className="mt-6 font-serif text-2xl tracking-tight">
        Nothing in the diary just yet.
      </p>
      <p className="mx-auto mt-3 max-w-sm leading-relaxed text-ink-muted">
        The term card goes up a week or two before term begins. Join the mailing
        list and you&rsquo;ll hear about the next mushaira first.
      </p>
      <ButtonLink href="/join" variant="outline" className="mt-8">
        Join UrduSoc
      </ButtonLink>
    </div>
  );
}
