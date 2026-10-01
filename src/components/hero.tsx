import { hero } from "@/lib/content";
import type { Event } from "@/lib/db/schema";
import { HeroEvents } from "@/components/hero-events";
import { ButtonLink, Urdu } from "@/components/ui";

export function Hero({ events }: { events: Event[] }) {
  return (
    <section
      id="top"
      className="paper-wash relative border-b border-rule/70 bg-paper"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col px-5 py-14 sm:px-8 sm:py-16 lg:min-h-[calc(100svh-4rem)] lg:py-8">
        <div className="grid flex-1 gap-14 lg:grid-cols-[0.94fr_1.06fr] lg:items-center lg:gap-20">
          <div className="max-w-xl">
            <p className="flex items-center gap-3 text-sm font-medium tracking-[0.06em] text-ink-muted">
              <span aria-hidden className="h-px w-8 shrink-0 bg-gold/70" />
              {hero.label}
            </p>

            <h1 className="mt-7">
              <Urdu className="inline-block text-[3.1rem] leading-[1.5] text-forest sm:text-6xl lg:text-[4.5rem]">
                {hero.titleUrdu}
              </Urdu>
              <span className="mt-3 block max-w-xl font-serif text-[2.15rem] leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-[3.35rem]">
                {hero.headline}
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-[1.05rem] leading-relaxed text-ink-muted">
              {hero.supporting}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink
                href={hero.primaryCta.href}
                className="border border-transparent px-7 py-3.5 text-base"
              >
                {hero.primaryCta.label}
              </ButtonLink>

              <ButtonLink
                href={hero.secondaryCta.href}
                variant="outline"
                className="px-7 py-3.5 text-base"
              >
                {hero.secondaryCta.label}
              </ButtonLink>
            </div>
          </div>

          <HeroEvents events={events} />
        </div>

        <a
          href="#iqbal-quote-heading"
          aria-label="Continue to poetry"
          className="mx-auto mt-10 hidden h-9 w-9 items-center justify-center text-gold-deep transition-colors hover:text-forest lg:flex"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 4v14M7.5 13.5 12 18l4.5-4.5" />
          </svg>
        </a>
      </div>
    </section>
  );
}
