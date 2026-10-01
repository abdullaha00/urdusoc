import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader, SectionLabel, Urdu } from "@/components/ui";
import { CONTACT_EMAIL } from "@/lib/content";
import { getCurrentCommittee, getPastCommittees } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Committee",
  description:
    "The students who run the Cambridge University Urdu Society this year, the committees that came before them, and how to reach them.",
};

export default async function CommitteePage() {
  const [members, past] = await Promise.all([
    getCurrentCommittee(),
    getPastCommittees(),
  ]);
  return (
    <>
      <PageHeader
        titleUrdu="مجلس"
        title="The people who make it happen."
        intro="Every year, students volunteer their time to keep one of the world's great literary traditions spoken aloud at Cambridge. If you would like to help run the society - or just have an idea for an evening - say hello."
      />

      {/* ---- This year ---------------------------------------------------- */}
      <section className="border-b border-rule/70">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <SectionLabel as="h2" trailingRule className="text-ink-muted">
            This year
          </SectionLabel>

          {members.length > 0 ? (
            <ul className="mt-12 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((person) => (
                <li key={person.id} className="border-t border-rule pt-6">
                  {/* The complete 4:5 announcement card, including the
                      society's typography and decorative design. */}
                  {person.photoUrl ? (
                    <div className="relative mb-5 aspect-[4/5] overflow-hidden border border-rule bg-paper-deep">
                      <Image
                        src={person.photoUrl}
                        alt={`Announcement card for ${person.name}, ${person.role}.`}
                        fill
                        sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 90vw"
                        className="object-cover"
                      />
                    </div>
                  ) : null}

                  <p className="text-[0.62rem] tracking-[0.25em] text-gold-deep uppercase">
                    {person.role}
                  </p>

                  <h3 className="mt-2 font-serif text-2xl tracking-tight text-forest">
                    {person.name}
                  </h3>

                  {person.nameUrdu ? (
                    <Urdu className="mt-1 inline-block text-base text-ink-muted">
                      {person.nameUrdu}
                    </Urdu>
                  ) : null}

                  {person.college || person.course ? (
                    <p className="mt-2 text-xs text-ink-muted">
                      {[person.college, person.course]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
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
            <p className="mt-10 max-w-md leading-relaxed text-ink-muted">
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

      {/* ---- The archive -------------------------------------------------- */}
      {past.length > 0 ? (
        <section className="border-b border-rule/70 bg-paper-deep">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
            <SectionLabel as="h2" trailingRule className="text-ink-muted">
              Previous
            </SectionLabel>

            <div className="mt-12 space-y-16">
              {past.map(
                ({ year: pastYear, cohort, members: roster }, index) => (
                  <article
                    key={pastYear}
                    // The section label already draws a rule, so the first year
                    // goes without one of its own.
                    className={`grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-12 ${
                      index === 0 ? "" : "border-t border-rule pt-8"
                    }`}
                  >
                    <div>
                      <h3 className="font-serif text-3xl tracking-tight text-ink-muted">
                        {pastYear}
                      </h3>

                      {cohort?.photoUrl ? (
                        <div className="relative mt-5 aspect-[4/3] overflow-hidden border border-rule">
                          <Image
                            src={cohort.photoUrl}
                            alt={
                              cohort.photoAlt ??
                              `The ${pastYear} Urdu Society committee.`
                            }
                            fill
                            sizes="(min-width: 1024px) 16rem, 90vw"
                            className="object-cover"
                          />
                        </div>
                      ) : null}
                    </div>

                    {/* Name, college and course only - no bios. Keeping the
                      archive this light is what makes it maintainable. */}
                    <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
                      {roster.map((person) => (
                        <li
                          key={person.id}
                          className="border-t border-rule/60 pt-4"
                        >
                          <p className="text-[0.58rem] tracking-[0.25em] text-ink-muted uppercase">
                            {person.role}
                          </p>
                          <p className="mt-1.5 font-serif text-lg tracking-tight text-ink-muted">
                            {person.name}
                          </p>
                          {person.college || person.course ? (
                            <p className="mt-0.5 text-xs text-ink-muted/80">
                              {[person.college, person.course]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
