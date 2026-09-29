import type { Metadata } from "next";
import { HeritageMapLoader } from "@/components/heritage-map-loader";
import { JoinCta } from "@/components/join-cta";
import { PageHeader, SectionLabel } from "@/components/ui";
import { HERITAGE_LOCATIONS } from "@/lib/heritage";

export const metadata: Metadata = {
  title: "Urdu in Cambridge",
  description:
    "An exhibition map of the places in Cambridge with a thread to Urdu literary history — Iqbal at Trinity, Rahmat Ali at Emmanuel, and the streets in between.",
};

export default function HistoryPage() {
  return (
    <>
      <PageHeader
        label="Urdu Cambridge"
        titleUrdu="تاریخ"
        title="The city has an Urdu history. Here is where it happened."
        intro="Four places within a mile of each other, each with a thread back to the language. Two colleges, two rented rooms — and between them, a good deal of the twentieth century."
      />

      <section className="border-b border-rule/70">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <SectionLabel as="h2" trailingRule className="text-ink-muted">
            The map
          </SectionLabel>

          <p className="mt-6 max-w-xl leading-relaxed text-ink-muted">
            Select a pin to read about it. The map opens fixed on the city
            centre; use <span className="text-forest">Explore map</span> if you
            would rather move around freely.
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

      <section className="bg-paper-deep">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <SectionLabel as="h2" className="text-ink-muted">
            A note on the sources
          </SectionLabel>
          <p className="mt-8 max-w-xl leading-relaxed text-ink-muted">
            These entries were assembled by the society, not by historians, and
            a couple of them rest on local tradition more than on documents —
            the Humberstone Road entry says so where it matters. If you know one
            of these places better than we do, or can point us at a source, we
            would genuinely like to hear from you.
          </p>
        </div>
      </section>

      <JoinCta />
    </>
  );
}
