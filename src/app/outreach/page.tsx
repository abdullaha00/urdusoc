import type { Metadata } from "next";
import { ArrowLink, PageHeader, SectionLabel } from "@/components/ui";
import { CONTACT_EMAIL, outreach } from "@/lib/content";

export const metadata: Metadata = {
  title: "Outreach",
  description:
    "How the Cambridge University Urdu Society takes the language beyond the university — and helps out where it has nothing to do with Urdu at all.",
};

export default function OutreachPage() {
  return (
    <>
      <PageHeader
        label="Outreach"
        titleUrdu="خدمت"
        title="What we do outside the university."
        intro={outreach.intro}
      />

      <section className="border-b border-rule/70">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <SectionLabel as="h2" trailingRule className="text-ink-muted">
            Where we work
          </SectionLabel>

          <ul className="mt-14 grid gap-12 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-rule">
            {outreach.strands.map((strand, index) => (
              <li key={strand.title} className="sm:px-8 sm:first:pl-0 sm:last:pr-0">
                <span className="flex items-center gap-3 text-xs font-medium tracking-[0.2em] text-gold-deep">
                  {String(index + 1).padStart(2, "0")}
                  <span aria-hidden className="h-px w-6 bg-gold/60" />
                </span>
                <h3 className="mt-3 font-serif text-2xl tracking-tight text-forest">
                  {strand.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {strand.body}
                </p>
                <p className="mt-4 text-[0.62rem] tracking-[0.22em] text-ink-muted uppercase">
                  {strand.status}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-paper-deep">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <SectionLabel as="h2" className="text-ink-muted">
            Work with us
          </SectionLabel>
          <p className="mt-8 max-w-xl leading-relaxed">{outreach.closing}</p>
          <div className="mt-8">
            <ArrowLink href="/contact" className="text-forest">
              Get in touch
            </ArrowLink>
          </div>
          <p className="mt-6 text-sm text-ink-muted">
            Or write straight to{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline decoration-gold/50 underline-offset-4"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
