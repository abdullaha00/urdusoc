import Link from "next/link";
import type { Event } from "@/lib/db/schema";
import {
  formatEventDateWithYear,
  formatEventTime,
  formatPrice,
  toDateTimeAttribute,
} from "@/lib/format";
import { Urdu } from "@/components/ui";

/** Row used on /events for both upcoming and past listings. */
export function EventCard({
  event,
  muted = false,
}: {
  event: Event;
  muted?: boolean;
}) {
  return (
    <li className="group">
      <Link
        href={`/events/${event.slug}`}
        className="grid gap-4 border-b border-rule py-8 transition-colors duration-200 sm:grid-cols-[10rem_1fr_auto] sm:items-baseline sm:gap-8"
      >
        <div>
          <time
            dateTime={toDateTimeAttribute(event.startsAt)}
            className={`block text-sm ${muted ? "text-ink-muted" : "text-forest"}`}
          >
            {formatEventDateWithYear(event.startsAt)}
          </time>
          <span className="mt-1 block text-xs text-ink-muted">
            {formatEventTime(event.startsAt)}
          </span>
        </div>

        <div>
          <div className="flex flex-wrap items-baseline gap-3">
            <h3 className="font-serif text-2xl tracking-tight text-ink transition-colors duration-200 group-hover:text-forest">
              {event.title}
            </h3>
            {event.kindUrdu ? (
              <Urdu className="text-base leading-none text-gold-deep">
                {event.kindUrdu}
              </Urdu>
            ) : null}
          </div>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
            {event.summary}
          </p>
          <p className="mt-2 text-xs tracking-[0.18em] text-ink-muted uppercase">
            {event.venue}
          </p>
        </div>

        <span className="text-sm text-ink-muted sm:text-right">
          {event.ticketing === "paid"
            ? formatPrice(event.pricePence)
            : event.ticketing === "rsvp"
              ? "Free · RSVP"
              : "Free"}
        </span>
      </Link>
    </li>
  );
}
