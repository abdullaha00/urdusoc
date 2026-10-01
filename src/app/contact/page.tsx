import type { Metadata } from "next";
import {
  ButtonLink,
  Diamond,
  PageHeader,
  SectionLabel,
  Urdu,
} from "@/components/ui";
import {
  CONTACT_EMAIL,
  EXTERNAL_LINKS,
  PLACEHOLDER_LINK,
  contact,
} from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "How to reach the Cambridge University Urdu Society - enquiries, collaborations, press and alumni.",
};

export default function ContactPage() {
  // Until the committee creates the enquiry form, the page leads with the
  // address instead. Showing a button that goes nowhere would be worse than
  // showing no button.
  const hasForm = contact.enquiryFormUrl !== PLACEHOLDER_LINK;

  return (
    <>
      <PageHeader
        titleUrdu="رابطہ"
        title="Say hello."
        intro={contact.intro}
      />

      <section className="border-b border-rule/70">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:gap-20 lg:py-24">
          <div>
            <SectionLabel as="h2" className="text-ink-muted">
              Get in touch
            </SectionLabel>

            {hasForm ? (
              <>
                <p className="mt-8 max-w-md leading-relaxed">
                  The quickest way to reach us is the enquiry form. It comes
                  through to the whole committee, so it gets seen even when one
                  of us is on holiday.
                </p>
                <ButtonLink href={contact.enquiryFormUrl} className="mt-8">
                  Open the enquiry form
                </ButtonLink>
                <p className="mt-6 text-sm text-ink-muted">
                  Prefer email? Write to{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="underline decoration-gold/50 underline-offset-4"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>
              </>
            ) : (
              <>
                <p className="mt-8 max-w-md leading-relaxed">
                  Email is the surest way to reach us. It goes to the whole
                  committee, so it gets answered even out of term.
                </p>
                <ButtonLink href={`mailto:${CONTACT_EMAIL}`} className="mt-8">
                  {CONTACT_EMAIL}
                </ButtonLink>
                <p className="mt-6 max-w-md text-sm text-ink-muted">
                  We are also quick to reply on{" "}
                  <a
                    href={EXTERNAL_LINKS.instagram}
                    className="underline decoration-gold/50 underline-offset-4"
                  >
                    Instagram
                  </a>
                  .
                </p>
              </>
            )}

            <div className="mt-10 flex items-center gap-3">
              <span aria-hidden className="h-px w-10 bg-rule" />
              <Diamond className="opacity-70" />
            </div>

            <dl className="mt-10 space-y-7">
              {contact.routes.map((route) => (
                <div key={route.title}>
                  <dt className="text-[0.62rem] tracking-[0.25em] text-gold-deep uppercase">
                    {route.title}
                  </dt>
                  <dd className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
                    {route.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* <div className="lg:self-center">
            <div className="border border-gold/35 bg-paper p-8 shadow-paper sm:p-10">
              <Urdu className="block text-center text-3xl leading-[1.8] text-forest">
                خدا حافظ
              </Urdu>
              <p className="mt-4 text-center text-[0.65rem] tracking-[0.3em] text-ink-muted uppercase">
                Khuda Hafiz
              </p>
              <p className="mt-6 text-center text-sm leading-relaxed text-ink-muted">
                A warm and very ordinary Urdu goodbye - closer to &ldquo;may God
                protect you&rdquo; than to anything formal.
              </p>
            </div>
          </div> */}
        </div>
      </section>
    </>
  );
}
