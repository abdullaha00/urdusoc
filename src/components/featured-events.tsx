"use client";

import { useRef, useState } from "react";
import { FeaturedPostcard } from "@/components/event-postcard";
import type { Event } from "@/lib/db/schema";

/**
 * The featured carousel above the events grid.
 *
 * Built as a scroll-snapping list rather than a JavaScript slider: swipe and
 * trackpad gestures work natively, it degrades to a plain scrollable row
 * without script, and there is no autoplay to trap anyone mid-read. The arrows
 * and dots drive `scrollTo` on the same container.
 *
 * The whole strip is a <ul> of links, so keyboard users tab through the cards
 * in order and never have to operate the controls at all — which is why the
 * arrows and dots are hidden from assistive technology as redundant.
 */
export function FeaturedEvents({ events }: { events: Event[] }) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);

  if (events.length === 0) return null;

  const scrollToCard = (next: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const clamped = Math.min(events.length - 1, Math.max(0, next));
    const card = scroller.children[clamped];
    if (card instanceof HTMLElement) {
      scroller.scrollTo({ left: card.offsetLeft - scroller.offsetLeft, behavior: "smooth" });
    }
    setIndex(clamped);
  };

  /** Keeps the dots honest when the user scrolls the strip by hand. */
  const onScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let nearest = 0;
    let shortest = Infinity;

    Array.from(scroller.children).forEach((child, position) => {
      if (!(child instanceof HTMLElement)) return;
      const distance = Math.abs(
        child.offsetLeft - scroller.offsetLeft - scroller.scrollLeft,
      );
      if (distance < shortest) {
        shortest = distance;
        nearest = position;
      }
    });

    setIndex(nearest);
  };

  const single = events.length === 1;

  return (
    <div>
      <ul
        ref={scrollerRef}
        onScroll={onScroll}
        className={`flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          single ? "" : "lg:gap-8"
        }`}
      >
        {events.map((event) => (
          <li
            key={event.id}
            className={`w-[85vw] shrink-0 snap-start sm:w-[28rem] ${
              single ? "lg:w-[38rem]" : "lg:w-[32rem]"
            }`}
          >
            <FeaturedPostcard event={event} />
          </li>
        ))}
      </ul>

      {events.length > 1 ? (
        <div aria-hidden className="mt-6 flex items-center gap-5">
          <div className="flex gap-3">
            <CarouselButton
              label="Previous"
              disabled={index === 0}
              onClick={() => scrollToCard(index - 1)}
              path="M10 3.5 5.5 8l4.5 4.5"
            />
            <CarouselButton
              label="Next"
              disabled={index === events.length - 1}
              onClick={() => scrollToCard(index + 1)}
              path="M6 3.5 10.5 8 6 12.5"
            />
          </div>

          <div className="flex items-center gap-2">
            {events.map((event, position) => (
              <button
                key={event.id}
                type="button"
                tabIndex={-1}
                onClick={() => scrollToCard(position)}
                className={`h-px w-8 transition-colors duration-200 ${
                  position === index ? "bg-forest" : "bg-rule"
                }`}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CarouselButton({
  label,
  path,
  disabled,
  onClick,
}: {
  label: string;
  path: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="inline-flex size-9 items-center justify-center rounded-full border border-rule text-forest transition-colors duration-200 hover:border-forest disabled:opacity-35 disabled:hover:border-rule"
    >
      <svg
        viewBox="0 0 16 16"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={path} />
      </svg>
    </button>
  );
}
