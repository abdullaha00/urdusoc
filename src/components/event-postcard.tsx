import Image from "next/image";
import { Urdu } from "@/components/ui";
import type { Event } from "@/lib/db/schema";
import { EVENT_CATEGORIES, collaborationLine } from "@/lib/events";
import {
  formatEventDateWithYear,
  formatEventTimeRange,
  formatPrice,
  toDateAttribute,
  toDateTimeAttribute,
} from "@/lib/format";

/**
 * The two ways /events shows an event, both of them list rows: a tall row for
 * the handful of featured events, and a compact one for the rest of the
 * programme.
 *
 * Rows rather than a grid of cards or a carousel. Forty-odd events laid out as
 * cards is a page you scroll past; as rows, each one is a single line of text
 * at a fixed height, the dates fall into a column down the right, and the eye
 * can run the list without stopping. The featured rows are the same shape at a
 * larger size, so the two lists share their left edge and their date column -
 * what makes a featured entry featured is the space it is given and what it
 * says in it (the summary, the co-hosts, the price), not a different format.
 *
 * The category shows as a thin vertical strip down the left edge rather than a
 * filled pill: it classifies the entry the way a gallery label classifies a
 * work, without competing with the title for attention, and it costs no height.
 *
 * Poster art is optional and is missing for about a quarter of the programme.
 * The poster box is 4:5 rather than landscape because the posters are made for
 * Instagram, where they are square or portrait, and the date, time and room are
 * usually printed along the bottom edge. A landscape crop cut exactly that off.
 *
 * The per-event pages are archived (see archive/event-pages/README.md), so a
 * row is a label to read rather than a thing to click - with one exception:
 * where the society published a post for the evening, the row links out to it.
 * That post is the only place a reader can see more than the row says, and for
 * most of the archive it is the only thing left. Rows without one stay inert,
 * and nothing suggests otherwise on hover.
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

export function Poster({
  event,
  sizes,
  className = "",
}: {
  event: Event;
  sizes: string;
  className?: string;
}) {
  if (!event.posterUrl) return null;

  const artwork = (
    <Image
      src={event.posterUrl}
      // Falls back to the title rather than an empty string: the poster is
      // the only place some events state their guest or their venue.
      alt={event.posterAlt ?? event.title}
      fill
      sizes={sizes}
      className="object-cover"
    />
  );

  const classes = `relative flex items-center justify-center overflow-hidden border border-rule bg-paper-deep ${
    event.instagramUrl
      ? "transition-colors duration-200 hover:border-gold"
      : ""
  } ${className}`;

  return event.instagramUrl ? (
    <a
      href={event.instagramUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`View ${event.title} on Instagram`}
      className={classes}
    >
      {artwork}
    </a>
  ) : (
    <div className={classes}>{artwork}</div>
  );
}

/**
 * Link out to the society's post for an evening, where there is one.
 *
 * Set in the row's own micro-type rather than as a button: it is a footnote
 * pointing at where the rest of this evening lives, and forty of them down a
 * list must not turn the programme into a wall of calls to action.
 */
export function InstagramLink({
  event,
  className = "",
}: {
  event: Event;
  className?: string;
}) {
  if (!event.instagramUrl) return null;

  return (
    <a
      href={event.instagramUrl}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1 text-[0.6rem] tracking-[0.18em] text-ink-muted uppercase underline decoration-current/30 underline-offset-4 transition-colors duration-200 hover:text-forest hover:decoration-current ${className}`}
    >
      {/* The title is in the row above, so the link needs the event named for
          anyone reaching it out of context - a screen reader's link list. */}
      <span className="sr-only">{event.title} - </span>
      On Instagram
      <span aria-hidden>↗</span>
    </a>
  );
}

function PriceNote({
  event,
  className = "",
}: {
  event: Event;
  className?: string;
}) {
  return (
    <span className={`text-ink-muted ${className}`}>
      {event.ticketing === "paid"
        ? formatPrice(event.pricePence)
        : event.ticketing === "rsvp"
          ? "Free · RSVP"
          : "Free"}
    </span>
  );
}

function DateLine({ event, className = "" }: { event: Event; className?: string }) {
  if (!event.startsAt) return <span className={className}>TBC</span>;

  // `endsAt` without an hour for the start cannot happen - both the sheet and
  // the admin form refuse it - but the range is gated on `showTime` all the
  // same, since that is what decides whether this line talks about hours at all.
  const time = event.showTime
    ? formatEventTimeRange(event.startsAt, event.endsAt)
    : null;

  return (
    <span className={className}>
      <time
        dateTime={
          event.showTime
            ? toDateTimeAttribute(event.startsAt)
            : toDateAttribute(event.startsAt)
        }
      >
        {formatEventDateWithYear(event.startsAt)}
        {time ? ` · ${time.start}` : ""}
      </time>
      {time?.end && event.endsAt ? (
        <>
          {"–"}
          <time dateTime={toDateTimeAttribute(event.endsAt)}>{time.end}</time>
        </>
      ) : null}
    </span>
  );
}

/**
 * One row of the featured list. Renders its own `<li>` - see `FeaturedList`.
 *
 * The compact row's shape at a larger size: title and date on the same baseline
 * either side of the row, and then the things only a featured entry says - the
 * summary, the co-hosts, the price - filling the left column underneath. When
 * present, the larger poster sits below the date in the right column.
 */
export function FeaturedRow({ event }: { event: Event }) {
  const collaboration = collaborationLine(event);

  return (
    <li className="relative border-b border-rule">
      <CategoryStrip event={event} />

      <div className="py-6 pl-5 sm:pl-6">
        <div className="min-w-0">
          <CategoryLabel event={event} />

          <div className="mt-2 sm:flex sm:items-baseline sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="font-serif text-xl leading-tight tracking-tight text-balance sm:text-2xl">
                  {event.title}
                </h3>
                {event.kindUrdu ? (
                  <Urdu className="text-sm leading-none text-gold-deep">
                    {event.kindUrdu}
                  </Urdu>
                ) : null}
              </div>

              {/* inline-block keeps the right-to-left title on the row's left
                  edge, rather than letting it drift to the right margin. */}
              {event.titleUrdu ? (
                <Urdu className="mt-1.5 inline-block text-base text-ink-muted">
                  {event.titleUrdu}
                </Urdu>
              ) : null}

              {event.venue ? (
                <p className="mt-1.5 text-[0.6rem] tracking-[0.18em] text-ink-muted uppercase">
                  {event.venue}
                </p>
              ) : null}

              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                {event.summary}
              </p>

              {/* The co-host line gets its own row: tracked-out uppercase
                  naming three societies is far too long to sit beside
                  anything. */}
              {collaboration ? (
                <p className="mt-3 text-xs leading-relaxed tracking-[0.14em] text-ink-muted uppercase">
                  {collaboration}
                </p>
              ) : null}

              <InstagramLink event={event} className="mt-3" />
            </div>

            {/* Date, time and artwork share the right-hand column. Events
                without artwork keep the same text-only row without an empty
                box or reserved gap. */}
            <div className="mt-3 sm:mt-0 sm:w-28 sm:shrink-0">
              <div className="flex items-baseline gap-3 sm:flex-col sm:items-end sm:gap-1">
                <DateLine
                  event={event}
                  className="font-serif text-base text-forest sm:text-lg"
                />
                <PriceNote event={event} className="text-xs sm:text-sm" />
              </div>
              <Poster
                event={event}
                sizes="(min-width: 640px) 7rem, 5rem"
                className="mt-3 aspect-[4/5] w-20 sm:w-28"
              />
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

/** The featured list. Same width as the programme list below it. */
export function FeaturedList({
  events,
  className = "",
}: {
  events: Event[];
  className?: string;
}) {
  if (events.length === 0) return null;

  return (
    <ul className={`max-w-3xl border-t border-rule ${className}`}>
      {events.map((event) => (
        <FeaturedRow key={event.id} event={event} />
      ))}
    </ul>
  );
}

/**
 * One row of the programme list. Renders its own `<li>`, so a list is just
 * these in a `<ul>` - see `EventList` below.
 *
 * Title, venue, date. On a narrow screen the date drops under the venue; from
 * `sm` up it sits in its own right-hand column, which is what makes a long list
 * scannable. When a poster exists it sits below that date, rather than making
 * every event reserve a thumbnail column.
 */
export function EventRow({
  event,
  muted = false,
}: {
  event: Event;
  muted?: boolean;
}) {
  return (
    <li className={`relative border-b border-rule ${muted ? "opacity-70" : ""}`}>
      <CategoryStrip event={event} />

      <div className="py-3 pl-5 sm:pl-6">
        {/* min-w-0 lets the long venue names truncate instead of shoving the
            date column off the right edge. */}
        <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h3 className="font-serif text-base leading-snug tracking-tight sm:text-lg">
              {event.title}
            </h3>

            {event.venue ? (
              <p className="mt-0.5 truncate text-[0.6rem] tracking-[0.18em] text-ink-muted uppercase">
                {event.venue}
              </p>
            ) : null}

            <InstagramLink event={event} className="mt-1" />
          </div>

          <div className="mt-1 sm:mt-0 sm:w-14 sm:shrink-0">
            <DateLine
              event={event}
              className="block text-xs text-forest sm:text-right sm:text-sm"
            />
            <Poster
              event={event}
              sizes="56px"
              className="mt-2 aspect-[4/5] w-12 sm:ml-auto sm:w-14"
            />
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * The list itself. Held narrower than the sections around it: a row whose title
 * sits at the far left and date at the far right of a 72rem page is a row you
 * have to read in two goes.
 */
export function EventList({
  events,
  muted = false,
  className = "",
}: {
  events: Event[];
  muted?: boolean;
  className?: string;
}) {
  return (
    <ul className={`max-w-3xl border-t border-rule ${className}`}>
      {events.map((event) => (
        <EventRow key={event.id} event={event} muted={muted} />
      ))}
    </ul>
  );
}
