import { pillars } from "@/lib/content";
import { SectionLabel } from "@/components/ui";

export function WhatWeDo() {
  return (
    <section id="about" className="border-b border-rule/70">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
        <SectionLabel trailingRule className="text-ink-muted">
          What we do
        </SectionLabel>

        <h2 className="mt-10 max-w-2xl font-serif text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
          Three threads run through everything we put on.
        </h2>

        <ul className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-rule">
          {pillars.map((pillar, index) => (
            <li
              key={pillar.title}
              className="sm:px-8 sm:first:pl-0 sm:last:pr-0"
            >
              <span className="flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-gold-deep">
                {String(index + 1).padStart(2, "0")}
                <span aria-hidden className="h-px w-6 bg-gold/60" />
              </span>
              <h3 className="mt-3 font-serif text-2xl tracking-tight text-forest">
                {pillar.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                {pillar.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
