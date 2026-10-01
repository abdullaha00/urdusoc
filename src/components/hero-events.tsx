"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { hero } from "@/lib/content";
import type { Event } from "@/lib/db/schema";
import {
  formatEventDateShort,
  formatEventTimeRange,
  toDateAttribute,
  toDateTimeAttribute,
} from "@/lib/format";
import { ArrowLink, Diamond, Urdu } from "@/components/ui";

type Panel = "title" | "events";

export function HeroEvents({ events }: { events: Event[] }) {
  // The programme is what a visitor came for, so it is what the card opens on;
  // the title page is the thing you turn to.
  const [panel, setPanel] = useState<Panel>("events");
  // Counts switches rather than tracking anything: changing it remounts the
  // stack, which is what replays the shuffle keyframes.
  const [shuffle, setShuffle] = useState(0);

  function show(next: Panel) {
    if (next === panel) return;
    setPanel(next);
    setShuffle((count) => count + 1);
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div
        role="group"
        aria-label="Hero card"
        className="mb-4 flex justify-center gap-5"
      >
        <PanelTab
          id="hero-events-tab"
          controls="hero-events-panel"
          selected={panel === "events"}
          onClick={() => show("events")}
        >
          Events
        </PanelTab>
        <PanelTab
          id="hero-title-tab"
          controls="hero-title-panel"
          selected={panel === "title"}
          onClick={() => show("title")}
        >
          Title page
        </PanelTab>
      </div>

      <PaperStack shuffle={shuffle}>
        {panel === "title" ? (
          <div
            id="hero-title-panel"
            role="region"
            aria-label="UrduSoc title page"
            className="paper-leaf flex flex-1 flex-col justify-center"
          >
            <TitlePage />
          </div>
        ) : (
          <div
            id="hero-events-panel"
            role="region"
            aria-label="Term events"
            className="paper-leaf flex flex-1 flex-col"
          >
            <EventProgramme events={events} />
          </div>
        )}
      </PaperStack>
    </div>
  );
}

function PanelTab({
  id,
  controls,
  selected,
  onClick,
  children,
}: {
  id: string;
  controls: string;
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      id={id}
      type="button"
      aria-controls={controls}
      aria-pressed={selected}
      onClick={onClick}
      className={`border-b py-1.5 text-sm font-medium transition-colors ${
        selected
          ? "border-gold text-forest"
          : "border-transparent text-ink-muted hover:text-forest"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * The date column of a programme line: "Fri 23 Oct" over "7–9 PM".
 *
 * The outer element is a plain div rather than a `<time>`, because an end time
 * needs an element of its own - see `formatEventTimeRange`. The date's own
 * `<time>` still carries the full start instant when the hour is known.
 */
function EventWhen({ event }: { event: Event }) {
  const time = event.showTime
    ? formatEventTimeRange(event.startsAt, event.endsAt)
    : null;

  return (
    <div className="text-sm leading-snug text-forest sm:text-[0.95rem]">
      <time
        dateTime={
          event.showTime
            ? toDateTimeAttribute(event.startsAt)
            : toDateAttribute(event.startsAt)
        }
        className="block font-semibold"
      >
        {formatEventDateShort(event.startsAt)}
      </time>
      {time ? (
        <span className="mt-1 block text-ink-muted">
          {time.start}
          {time.end && event.endsAt ? (
            <>
              {"–"}
              <time dateTime={toDateTimeAttribute(event.endsAt)}>
                {time.end}
              </time>
            </>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

function EventProgramme({ events }: { events: Event[] }) {
  return (
    <>
      <div className="border-b border-gold/30 px-6 py-5 text-center sm:px-9 sm:py-6">
        <h2 className="text-sm font-semibold tracking-[0.08em] text-gold-deep sm:text-[0.95rem]">
          Upcoming events
        </h2>
      </div>

      {events.length > 0 ? (
        <ul className="flex flex-1 flex-col divide-y divide-rule/80">
          {events.map((event) => (
            // `basis-0` as well as `flex-1`: rows divide the card's height
            // equally instead of each keeping its own content height plus a
            // share of the slack, which left the rules falling at uneven
            // intervals once one title wrapped.
            <li key={event.id} className="sm:flex-1 sm:basis-0">
              {/* A programme line, not a link: the per-event pages are archived
                  (see archive/event-pages/README.md), and "View all events"
                  below is the only place left to go. */}
              <div className="grid h-full content-center gap-3 px-6 py-5 sm:grid-cols-[6.5rem_1fr] sm:items-baseline sm:gap-5 sm:px-9 sm:py-6">
                <EventWhen event={event} />

                <div>
                  <h3 className="font-serif text-[1.45rem] leading-[1.08] tracking-tight text-balance sm:text-[1.7rem]">
                    {event.title}
                  </h3>
                  {event.titleUrdu ? (
                    <Urdu className="mt-1 inline-block text-base leading-[1.5] text-gold-deep sm:text-lg">
                      {event.titleUrdu}
                    </Urdu>
                  ) : null}

                  {/* Small caps rather than the muted sentence it used to be,
                      which now reads as the summary's second line. This is the
                      venue treatment /events already uses. */}
                  {event.venue ? (
                    <p className="mt-2 text-[0.65rem] tracking-[0.18em] text-ink-muted uppercase">
                      {event.venue}
                    </p>
                  ) : null}

                  {/* Clamped to two lines: the rows divide the card's height
                      between them, so one 300-character summary must not take
                      another evening's room. The whole sentence is on /events
                      and the sheet caps it at 300 characters anyway. */}
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">
                    {event.summary}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 items-center justify-center px-6 py-12 text-center sm:px-8">
          <p className="font-serif text-2xl text-forest">
            No events are currently listed.
          </p>
        </div>
      )}

      <div className="flex justify-end border-t border-gold/30 px-6 py-5 sm:px-9 sm:py-6">
        <ArrowLink href="/events" className="text-forest">
          View all events
        </ArrowLink>
      </div>
    </>
  );
}

function PaperStack({
  shuffle,
  children,
}: {
  shuffle: number;
  children: ReactNode;
}) {
  return (
    <div
      // Remounting on each switch is what restarts the keyframes - CSS
      // animations only replay on a fresh element. The class is withheld at
      // `shuffle === 0` so the card doesn't shuffle itself on first paint.
      key={shuffle}
      className={`relative w-full ${shuffle > 0 ? "paper-shuffle" : ""}`}
    >
      <div
        aria-hidden
        className="paper-sheet-back pointer-events-none absolute inset-0 -rotate-3 rounded-sm border border-rule bg-paper-deep/60"
      />
      <div
        aria-hidden
        className="paper-sheet-mid pointer-events-none absolute inset-0 rotate-[1.5deg] rounded-sm border border-rule bg-paper"
      />

      <div className="paper-plate relative rounded-sm border border-forest/15 bg-paper p-3 shadow-lift sm:p-4">
        {/* Both panels are held to one height from `sm` up, so the card keeps
            its size - and its place in the centred hero grid - when you switch
            tabs. The floor is set above either panel's natural height to stand
            the card up against the headline column beside it. Below `sm` the
            event rows stack and outgrow it, so it only applies from `sm`. */}
        <div className="relative flex flex-col overflow-hidden border border-gold/40 sm:min-h-[32rem] lg:min-h-[35rem]">
          {[
            "left-2 top-2",
            "right-2 top-2",
            "left-2 bottom-2",
            "right-2 bottom-2",
          ].map((position) => (
            <span
              key={position}
              aria-hidden
              className={`pointer-events-none absolute z-10 ${position} size-1.5 rotate-45 bg-gold/70`}
            />
          ))}

          {children}
        </div>
      </div>
    </div>
  );
}

const deepDescenders = new Set(["زبان", "ادب"]);

function TitlePage() {
  return (
    <div className="relative px-8 py-7 sm:px-14 sm:py-9">
      <div aria-hidden className="ruled absolute inset-0 opacity-30" />

      <div className="relative flex flex-col items-center">
        {hero.motifWords.map((word, index) => (
          <div key={word.urdu} className="flex flex-col items-center">
            {index > 0 ? <Diamond className="mt-2 mb-3 opacity-70" /> : null}
            <Urdu className="text-4xl leading-[1.55] text-forest sm:text-5xl lg:text-[3.35rem]">
              {word.urdu}
            </Urdu>
            <span
              className={`${deepDescenders.has(word.urdu) ? "mt-5" : "mt-1"} -me-[0.3em] text-[0.6rem] tracking-[0.3em] text-ink-muted uppercase sm:text-[0.65rem]`}
            >
              {word.english}
            </span>
          </div>
        ))}
      </div>

      <div className="relative mt-6 flex items-center justify-center gap-3 border-t border-gold/25 pt-4 sm:mt-8 sm:pt-5">
        <span className="-me-[0.3em] text-[0.6rem] tracking-[0.3em] text-gold-deep uppercase sm:text-[0.65rem]">
          {hero.motifFooter.latin}
        </span>
        <Diamond className="opacity-70" />
        <Urdu className="text-xs leading-none text-gold-deep">
          {hero.motifFooter.urdu}
        </Urdu>
      </div>
    </div>
  );
}
