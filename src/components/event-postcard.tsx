import Image from "next/image";
import Link from "next/link";
import { Urdu } from "@/components/ui";
import type { Event } from "@/lib/db/schema";
import { EVENT_CATEGORIES, collaborationLine } from "@/lib/events";
import {
  formatEventDateWithYear,
  formatEventTime,
  formatPrice,
  toDateAttribute,
  toDateTimeAttribute,
} from "@/lib/format";

/**
 * Museum-label postcards for /events.
 *
 * The category shows as a thin vertical strip down the left edge rather than a
 * filled pill: it classifies the card the way a gallery label classifies a
 * work, without competing with the title for attention.
 *
 * Poster art is optional and is expected to be missing most of the time. The
 * card is laid out so that the text alone looks deliberate — the poster, when
 * there is one, sits above the text and changes nothing else.
 */

function CategoryStrip({ event }: { event: Event }) {
  const category = EVENT_CATEGORIES[event.category];
  return (
    <span
      aria-hidden
      className="absolute inset-y-0 left-0 w-[3px]"
      style={{ backgroundColor: category.swatch }}
    />
  );
}

function CategoryLabel({ event }: { event: Event }) {
  const category = EVENT_CATEGORIES[event.category];
  return (
    <span className="flex items-center gap-2 text-[0.6rem] tracking-[0.25em] uppercase">
      <span
        aria-hidden
        className="size-1.5 rotate-45"
        style={{ backgroundColor: category.swatch }}
      />
      <span style={{ color: category.swatch }}>{category.label}</span>
    </span>
  );
}

function Poster({
  event,
  sizes,
  className = "",
}: {
  event: Event;
  sizes: string;
  className?: string;
}) {
  if (!event.posterUrl) return null;
  return (
    <div
      className={`relative overflow-hidden border border-rule bg-paper-deep ${className}`}
    >
      <Image
        src={event.posterUrl}
        // Falls back to the title rather than an empty string: the poster is
        // the only place some events state their guest or their venue.
        alt={event.posterAlt ?? event.title}
        fill
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}

function PriceNote({ event }: { event: Event }) {
  return (
    <span className="text-sm text-ink-muted">
      {event.ticketing === "paid"
        ? formatPrice(event.pricePence)
        : event.ticketing === "rsvp"
          ? "Free · RSVP"
          : "Free"}
    </span>
  );
}

function DateLine({ event, className = "" }: { event: Event; className?: string }) {
  return (
    <time
      dateTime={
        event.showTime
          ? toDateTimeAttribute(event.startsAt)
          : toDateAttribute(event.startsAt)
      }
      className={className}
    >
      {formatEventDateWithYear(event.startsAt)}
      {event.showTime ? ` · ${formatEventTime(event.startsAt)}` : ""}
    </time>
  );
}

/** Large card for the featured carousel. */
export function FeaturedPostcard({ event }: { event: Event }) {
  const collaboration = collaborationLine(event);

  return (
    <article className="group relative h-full border border-rule bg-paper shadow-paper transition-colors duration-200 hover:border-gold">
      <CategoryStrip event={event} />

      <Link href={`/events/${event.slug}`} className="block h-full p-7 pl-9 sm:p-9 sm:pl-11">
        <Poster
          event={event}
          sizes="(min-width: 1024px) 30rem, 90vw"
          className="mb-7 aspect-[4/3]"
        />

        <CategoryLabel event={event} />

        <div className="mt-5 flex flex-wrap items-baseline gap-3">
          <h3 className="font-serif text-3xl leading-tight tracking-tight text-balance transition-colors duration-200 group-hover:text-forest sm:text-4xl">
            {event.title}
          </h3>
          {event.kindUrdu ? (
            <Urdu className="text-lg leading-none text-gold-deep">
              {event.kindUrdu}
            </Urdu>
          ) : null}
        </div>

        {/* inline-block keeps the right-to-left title on the card's left edge,
            rather than letting it drift to the right margin. */}
        {event.titleUrdu ? (
          <Urdu className="mt-2 inline-block text-xl text-ink-muted">
            {event.titleUrdu}
          </Urdu>
        ) : null}

        <DateLine
          event={event}
          className="mt-5 block font-serif text-xl text-forest"
        />

        {event.venue ? (
          <p className="mt-1 text-xs tracking-[0.18em] text-ink-muted uppercase">
            {event.venue}
          </p>
        ) : null}

        <p className="mt-5 max-w-md leading-relaxed text-ink-muted">
          {event.summary}
        </p>

        {/* The co-host line gets its own row: tracked-out uppercase naming
            three societies is far too long to sit opposite the price. */}
        {collaboration ? (
          <p className="mt-5 text-xs leading-relaxed tracking-[0.14em] text-ink-muted uppercase">
            {collaboration}
          </p>
        ) : null}

        <div className="mt-5 border-t border-rule pt-4">
          <PriceNote event={event} />
        </div>
      </Link>
    </article>
  );
}

/** Standard card for the grid below the carousel. */
export function EventPostcard({
  event,
  muted = false,
}: {
  event: Event;
  muted?: boolean;
}) {
  const collaboration = collaborationLine(event);

  return (
    <article
      className={`group relative h-full border border-rule bg-paper transition-colors duration-200 hover:border-gold ${
        muted ? "opacity-75" : "shadow-paper"
      }`}
    >
      <CategoryStrip event={event} />

      <Link
        href={`/events/${event.slug}`}
        className="flex h-full flex-col p-6 pl-8"
      >
        <Poster
          event={event}
          sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 90vw"
          className="mb-5 aspect-[4/3]"
        />

        <CategoryLabel event={event} />

        <div className="mt-4 flex flex-wrap items-baseline gap-2.5">
          <h3 className="font-serif text-2xl leading-tight tracking-tight text-balance transition-colors duration-200 group-hover:text-forest">
            {event.title}
          </h3>
          {event.kindUrdu ? (
            <Urdu className="text-base leading-none text-gold-deep">
              {event.kindUrdu}
            </Urdu>
          ) : null}
        </div>

        <DateLine event={event} className="mt-3 block text-sm text-forest" />

        {event.venue ? (
          <p className="mt-1 text-[0.65rem] tracking-[0.18em] text-ink-muted uppercase">
            {event.venue}
          </p>
        ) : null}

        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {event.summary}
        </p>

        {collaboration ? (
          <p className="mt-3 text-[0.65rem] leading-relaxed tracking-[0.14em] text-ink-muted uppercase">
            {collaboration}
          </p>
        ) : null}

        {/* Absorbs the slack so footers line up across a row of cards, while
            still leaving a gap when the summary runs long. */}
        <div aria-hidden className="grow" />

        <div className="mt-5 border-t border-rule pt-4">
          <PriceNote event={event} />
        </div>
      </Link>
    </article>
  );
}
