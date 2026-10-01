import type { Metadata } from "next";
import { HeritageMapLoader } from "@/components/heritage-map-loader";
import { PageHeader, SectionLabel } from "@/components/ui";
import { HERITAGE_LOCATIONS } from "@/lib/heritage";

export const metadata: Metadata = {
  title: "Urdu in Cambridge",
  description:
    "An exhibition map of the places in Cambridge with a thread to Urdu literary history - Iqbal at Trinity, Rahmat Ali at Emmanuel, the streets in between, and where the language is read and taught today.",
};

export default function HistoryPage() {
  return (
    <>
      <PageHeader
        titleUrdu="تاریخ"
        title="The city has an Urdu history. Here is where it happened."
        intro="Urdu has left its mark on Cambridge. These are the places where that history was made, and where the language is still read, studied and taught today."
      />

      <section className="border-b border-rule/70">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <SectionLabel as="h2" trailingRule className="text-ink-muted">
            The map
          </SectionLabel>

          <p className="mt-6 max-w-xl leading-relaxed text-ink-muted">
            Select a pin to read about it. The map opens framed so that every
            location is in view; pan and zoom freely, and use{" "}
            <span className="text-forest">View all</span> to come back to the
            full picture.
          </p>

          <div className="mt-10">
            <HeritageMapLoader />
          </div>

          {/*
            The same locations in writing. Server-rendered on purpose: this is
            the copy of record, and it must survive the map failing to load, a
            reader with no JavaScript, and anyone who would rather read four
            paragraphs than operate a map.
          */}
          <ol className="mt-10 grid gap-6 sm:grid-cols-2">
            {HERITAGE_LOCATIONS.map((location) => (
              <li
                key={location.id}
                className="border border-rule bg-paper p-6"
              >
                <p className="flex items-center gap-2 text-[0.6rem] tracking-[0.25em] text-gold-deep uppercase">
                  {location.category}
                  <span aria-hidden className="h-px w-5 bg-gold/50" />
                  {location.period}
                </p>
                <h3 className="mt-3 font-serif text-xl tracking-tight text-forest">
                  {location.name}
                </h3>
                <p className="mt-1 text-xs text-ink-muted">
                  {location.address}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {location.description}
                </p>
                {location.source ? (
                  <p className="mt-3 text-xs text-ink-muted/80 italic">
                    Source:{" "}
                    {location.source.href ? (
                      <a
                        href={location.source.href}
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-gold/50 underline-offset-4"
                      >
                        {location.source.label}
                      </a>
                    ) : (
                      location.source.label
                    )}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
