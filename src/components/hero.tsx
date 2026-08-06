import { hero } from "@/lib/content";
import { ArrowLink, ButtonLink, Diamond, SectionLabel, Urdu } from "@/components/ui";

export function Hero() {
  return (
    <section id="top" className="paper-wash border-b border-rule/70">
      <div className="mx-auto grid max-w-6xl gap-16 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20 lg:py-28">
        <div>
          <SectionLabel className="text-ink-muted">{hero.label}</SectionLabel>

          <h1 className="mt-8">
            {/* inline-block keeps the right-to-left title on the column's left edge */}
            <Urdu className="inline-block text-[2.75rem] leading-[1.55] text-forest sm:text-6xl lg:text-7xl">
              {hero.titleUrdu}
            </Urdu>
            <span className="mt-4 block max-w-xl font-serif text-3xl leading-[1.15] tracking-tight text-balance sm:text-4xl lg:text-[2.9rem]">
              {hero.headline}
            </span>
          </h1>

          <p className="mt-7 max-w-md leading-relaxed text-ink-muted">
            {hero.supporting}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <ButtonLink href={hero.primaryCta.href}>
              {hero.primaryCta.label}
            </ButtonLink>
            <ArrowLink
              href={hero.secondaryCta.href}
              className="text-ink-muted hover:text-forest"
            >
              {hero.secondaryCta.label}
            </ArrowLink>
          </div>
        </div>

        <HeroArtwork />
      </div>
    </section>
  );
}

/**
 * A CSS-only "title page": stacked sheets of paper with a ruled manuscript
 * frame. Purely decorative, so it is hidden from assistive technology.
 */
function HeroArtwork() {
  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-sm select-none lg:max-w-md"
    >
      <div className="absolute inset-0 -rotate-3 rounded-sm border border-rule bg-paper-deep/60" />
      <div className="absolute inset-0 rotate-[1.5deg] rounded-sm border border-rule bg-paper" />

      <div className="relative rounded-sm border border-forest/15 bg-paper p-3 shadow-lift sm:p-4">
        <div className="relative overflow-hidden border border-gold/40 px-8 py-12 sm:px-12 sm:py-14">
          <div className="ruled absolute inset-0 opacity-30" />

          {[
            "left-2 top-2",
            "right-2 top-2",
            "left-2 bottom-2",
            "right-2 bottom-2",
          ].map((position) => (
            <span
              key={position}
              className={`absolute ${position} size-1.5 rotate-45 bg-gold/70`}
            />
          ))}

          <div className="relative flex flex-col items-center">
            {hero.motifWords.map((word, index) => (
              <div key={word.urdu} className="flex flex-col items-center">
                {index > 0 ? <Diamond className="my-5 opacity-70" /> : null}
                <Urdu className="text-4xl leading-[1.6] text-forest sm:text-5xl">
                  {word.urdu}
                </Urdu>
                <span className="mt-1 text-[0.6rem] tracking-[0.3em] text-ink-muted uppercase">
                  {word.english}
                </span>
              </div>
            ))}
          </div>

          <div className="relative mt-12 flex items-center justify-center gap-3 border-t border-gold/25 pt-5">
            <span className="text-[0.6rem] tracking-[0.3em] text-gold-deep uppercase">
              {hero.motifFooter.latin}
            </span>
            <Diamond className="opacity-70" />
            <Urdu className="text-xs leading-none text-gold-deep">
              {hero.motifFooter.urdu}
            </Urdu>
          </div>
        </div>
      </div>
    </div>
  );
}
