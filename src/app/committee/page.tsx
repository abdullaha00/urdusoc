import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader, SectionLabel, Urdu } from "@/components/ui";
import { CONTACT_EMAIL } from "@/lib/content";
import { getCurrentCommittee } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Committee",
  description:
    "The students who run the Cambridge University Urdu Society this year, and how to reach them.",
};

export default async function CommitteePage() {
  const members = await getCurrentCommittee();
  const year = members[0]?.academicYear;

  return (
    <>
      <PageHeader
        label={year ? `Committee ${year}` : "Committee"}
        title="The people who make it happen."
        intro="A committee of students elected each year. If you would like to help run the society — or just have an idea for an evening — say hello."
      />

      <section className="border-b border-rule/70">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          {members.length > 0 ? (
            <ul className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((person) => (
                <li key={person.id} className="border-t border-rule pt-6">
                  {person.photoUrl ? (
                    <div className="relative mb-5 aspect-square w-24 overflow-hidden rounded-full border border-rule">
                      <Image
                        src={person.photoUrl}
                        alt={person.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                  ) : null}

                  <p className="text-[0.62rem] tracking-[0.25em] text-gold-deep uppercase">
                    {person.role}
                  </p>

                  <h2 className="mt-2 font-serif text-2xl tracking-tight text-forest">
                    {person.name}
                  </h2>

                  {person.nameUrdu ? (
                    <Urdu className="mt-1 block text-base text-ink-muted">
                      {person.nameUrdu}
                    </Urdu>
                  ) : null}

                  {person.bio ? (
                    <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                      {person.bio}
                    </p>
                  ) : null}

                  {person.email ? (
                    <a
                      href={`mailto:${person.email}`}
                      className="mt-3 inline-block text-sm text-ink underline decoration-transparent underline-offset-4 transition-colors hover:text-forest hover:decoration-gold"
                    >
                      {person.email}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="max-w-md leading-relaxed text-ink-muted">
              This year&rsquo;s committee is being confirmed. In the meantime,
              write to us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="underline decoration-gold/50 underline-offset-4"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          )}
        </div>
      </section>

      <section className="bg-paper-deep">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <SectionLabel as="h2" className="text-ink-muted">
            Handover
          </SectionLabel>
          <p className="mt-8 max-w-xl leading-relaxed text-ink-muted">
            Committee roles change hands at the end of Easter term. Outgoing
            officers: add your successor at{" "}
            <span className="text-forest">/admin/access</span> before you remove
            yourself, and work through the checklist in HANDOVER.md so nothing —
            the mailing list, the Instagram, the domain — is left behind.
          </p>
        </div>
      </section>
    </>
  );
}
