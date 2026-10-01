import type { Verse } from "@/lib/db/schema";
import { ArrowLink, Diamond, SectionLabel, Urdu } from "@/components/ui";

/**
 * Editorial verse spread. The verse comes from the `verses` table - the
 * committee changes it at /admin/verses, and the archive lives on /urdu.
 */
export function FeaturedUrdu({
  verse,
  showArchiveLink = false,
}: {
  verse: Verse | null;
  showArchiveLink?: boolean;
}) {
  if (!verse) return null;

  return (
    <section id="urdu" className="border-b border-rule/70 bg-paper-deep">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <SectionLabel as="h2" trailingRule className="text-ink-muted">
          From the world of Urdu
        </SectionLabel>

        <VerseSpread verse={verse} />

        {showArchiveLink ? (
          <div className="mx-auto mt-10 max-w-4xl">
            <ArrowLink href="/urdu" className="text-ink-muted hover:text-forest">
              More from the archive
            </ArrowLink>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** The verse itself, reusable on /urdu for each archive entry. */
export function VerseSpread({
  verse,
  className = "",
}: {
  verse: Verse;
  className?: string;
}) {
  return (
    <figure className={`mx-auto mt-12 max-w-4xl ${className}`}>
      <blockquote
        lang="ur"
        dir="rtl"
        className="relative rounded-sm border border-gold/35 bg-paper px-6 py-10 shadow-paper sm:px-12 sm:py-14"
      >
        <span
          aria-hidden
          className="absolute top-3 right-3 size-1.5 rotate-45 bg-gold/70"
        />
        <span
          aria-hidden
          className="absolute bottom-3 left-3 size-1.5 rotate-45 bg-gold/70"
        />
        <div className="urdu space-y-4 text-center text-[1.15rem] leading-[2.3] text-forest sm:text-2xl lg:text-[1.8rem]">
          {verse.urduLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </blockquote>

      <div className="mt-12 grid gap-10 sm:grid-cols-2 sm:gap-12">
        <p className="font-serif text-lg leading-relaxed text-ink-muted italic sm:text-xl">
          {verse.transliterationLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>

        <div>
          <Diamond className="mb-4 sm:hidden" />
          <p className="leading-relaxed whitespace-pre-line">
            {verse.translation}
          </p>
        </div>
      </div>

      <figcaption className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-rule pt-6 text-sm">
        <span className="font-medium">{verse.poetName}</span>
        {verse.poetUrdu ? (
          <>
            <Diamond className="opacity-70" />
            <Urdu className="text-base text-gold-deep">{verse.poetUrdu}</Urdu>
          </>
        ) : null}
        {verse.poetYears ? (
          <span className="text-ink-muted">{verse.poetYears}</span>
        ) : null}
      </figcaption>
    </figure>
  );
}
