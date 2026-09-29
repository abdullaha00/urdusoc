import type { Metadata } from "next";
import { JoinCta } from "@/components/join-cta";
import { ButtonLink, Diamond, PageHeader, SectionLabel, Urdu } from "@/components/ui";
import { about, pillars } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who the Cambridge University Urdu Society is, what we run, and how to find us.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        label="About"
        titleUrdu="ثقافت"
        title="A place in Cambridge where Urdu is spoken out loud."
        intro={about.intro}
      />

      <section className="border-b border-rule/70">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <SectionLabel as="h2" trailingRule className="text-ink-muted">
            What we do
          </SectionLabel>

          <h3 className="mt-10 max-w-2xl font-serif text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
            {about.heading}
          </h3>

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
                <h4 className="mt-3 font-serif text-2xl tracking-tight text-forest">
                  {pillar.title}
                </h4>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {pillar.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-rule/70 bg-paper-deep">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_1fr] lg:gap-20 lg:py-20">
          <div>
            <SectionLabel as="h2" className="text-ink-muted">
              Membership
            </SectionLabel>
            <p className="mt-8 max-w-md leading-relaxed">{about.membership}</p>
            <div className="mt-8 flex items-center gap-3">
              <span aria-hidden className="h-px w-10 bg-rule" />
              <Diamond className="opacity-70" />
            </div>
            <ButtonLink href="/join" className="mt-8">
              Join UrduSoc
            </ButtonLink>
          </div>

          <div className="lg:self-center">
            <div className="rounded-sm border border-gold/35 bg-paper p-8 shadow-paper sm:p-10">
              <Urdu className="block text-center text-3xl leading-[1.8] text-forest">
                زبان، ادب، ثقافت
              </Urdu>
              <p className="mt-4 text-center text-[0.65rem] tracking-[0.3em] text-ink-muted uppercase">
                Language · Literature · Culture
              </p>
            </div>
          </div>
        </div>
      </section>

      <JoinCta />
    </>
  );
}
