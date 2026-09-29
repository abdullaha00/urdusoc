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
  const year = members[0]?.academicYear;

  return (
    <>
      <PageHeader
        label={year ? `Committee ${year}` : "Committee"}
        title="The people who make it happen."
        intro="Every year, students volunteer their time to keep one of the world's great literary traditions spoken aloud at Cambridge. If you would like to help run the society — or just have an idea for an evening — say hello."
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
              Previous committees
            </SectionLabel>

            <p className="mt-6 max-w-xl leading-relaxed text-ink-muted">
              Everyone who has held a role here, kept in full. Set quieter than
              this year&rsquo;s roster because the work is done — not because it
              matters less.
            </p>

            <div className="mt-14 space-y-16">
              {past.map(({ year: pastYear, cohort, members: roster }) => (
                <article
                  key={pastYear}
                  className="grid gap-8 border-t border-rule pt-8 lg:grid-cols-[16rem_1fr] lg:gap-12"
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

                    {cohort?.note ? (
                      <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                        {cohort.note}
                      </p>
                    ) : null}
                  </div>

                  {/* Name, college and course only — no bios. Keeping the
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
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section>
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <SectionLabel as="h2" className="text-ink-muted">
            Handover
          </SectionLabel>
          <p className="mt-8 max-w-xl leading-relaxed text-ink-muted">
            Committee roles change hands at the end of Easter term. Outgoing
            officers: make sure your successor can sign in before you give up
            your own access, and work through the committee&rsquo;s handover
            checklist so nothing — the mailing list, the Instagram, the domain —
            is left behind.
          </p>
        </div>
      </section>
    </>
  );
}
