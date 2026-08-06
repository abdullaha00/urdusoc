import type { Metadata } from "next";
import { JoinForm } from "@/components/join-form";
import { Diamond, PageHeader, SectionLabel, Urdu } from "@/components/ui";
import { membershipTiers } from "@/lib/content";

export const metadata: Metadata = {
  title: "Join",
  description:
    "Join the Cambridge University Urdu Society — open to students, alumni and friends. No prior Urdu needed.",
};

export default function JoinPage() {
  return (
    <>
      <PageHeader
        label="Membership"
        titleUrdu="خوش آمدید"
        title="Find your Urdu community in Cambridge."
        intro="Membership is free and open to everyone. It means you hear about mushairas first, and it tells the SU how many of us there are."
      />

      <section className="border-b border-rule/70">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-20">
          <div>
            <SectionLabel as="h2" className="text-ink-muted">
              Sign up
            </SectionLabel>
            <div className="mt-8">
              <JoinForm />
            </div>
          </div>

          <div className="lg:border-l lg:border-rule lg:pl-16">
            <SectionLabel as="h2" className="text-ink-muted">
              Who can join
            </SectionLabel>

            <ul className="mt-8 divide-y divide-rule border-y border-rule">
              {membershipTiers.map((tier) => (
                <li key={tier.id} className="py-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-serif text-xl tracking-tight text-forest">
                      {tier.name}
                    </h3>
                    <span className="text-sm text-ink-muted">
                      {tier.pricePence > 0
                        ? `£${(tier.pricePence / 100).toFixed(2)}`
                        : "Free"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {tier.description}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-center gap-3">
              <span aria-hidden className="h-px w-10 bg-rule" />
              <Diamond className="opacity-70" />
            </div>

            <div className="mt-8 rounded-sm border border-gold/35 bg-paper-deep/60 p-6">
              <Urdu className="block text-center text-2xl leading-[1.8] text-forest">
                زبان، ادب، ثقافت
              </Urdu>
              <p className="mt-3 text-center text-[0.6rem] tracking-[0.3em] text-ink-muted uppercase">
                Language · Literature · Culture
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
