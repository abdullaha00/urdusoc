import { joinCta } from "@/lib/content";
import { ArrowLink, ButtonLink, SectionLabel } from "@/components/ui";

export function JoinCta() {
  return (
    <section className="on-dark bg-wine text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:py-24">
        <div>
          <SectionLabel className="text-paper/70">Membership</SectionLabel>
          <h2 className="mt-8 max-w-xl font-serif text-4xl leading-[1.1] tracking-tight text-balance sm:text-5xl">
            {joinCta.heading}
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-paper/80">
            {joinCta.body}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 lg:justify-end">
          <ButtonLink variant="light" href={joinCta.primaryCta.href}>
            {joinCta.primaryCta.label}
          </ButtonLink>
          <ArrowLink
            href={joinCta.secondaryCta.href}
            className="text-paper/85 hover:text-paper"
          >
            {joinCta.secondaryCta.label}
          </ArrowLink>
        </div>
      </div>
    </section>
  );
}
