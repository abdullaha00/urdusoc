import type { Metadata } from "next";
import { ArrowLink, PageHeader, SectionLabel } from "@/components/ui";
import { CONTACT_EMAIL, outreach } from "@/lib/content";

export const metadata: Metadata = {
  title: "Outreach",
  description:
    "How the Cambridge University Urdu Society takes the language beyond the university - and helps out where it has nothing to do with Urdu at all.",
};

export default function OutreachPage() {
  return (
    <>
      <PageHeader
        titleUrdu="خدمت"
        title="What we do outside the university."
        intro={outreach.intro}
      />

      {/*
        No background of its own, so it sits on the same paper as every other
        default section on the site. The rule under PageHeader already separates
        it from the masthead, and the footer brings its own border-t below.
      */}
      <section>
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
