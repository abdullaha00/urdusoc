import Link from "next/link";
import {
  AdminButtonLink,
  AdminPageHeader,
  AdminTable,
  Badge,
  EmptyState,
  Td,
  Th,
} from "@/components/admin/ui";
import { DangerConfirm } from "@/components/admin/danger-confirm";
import { Field, Input, SubmitButton, Textarea } from "@/components/form";
import { getAdminCommittee, getCommitteeCohorts } from "@/lib/admin/queries";
import type { CommitteeCohort } from "@/lib/db/schema";
import {
  deleteCommitteeMember,
  moveCommitteeMember,
  saveCommitteeCohort,
  startNewYear,
} from "./actions";
import { requireAdmin } from "@/lib/auth/guard";

export const metadata = { title: "Committee" };

export default async function AdminCommitteePage() {
  // Guarded here as well as in the layout: a layout is not re-rendered on
  // every navigation, so this is what makes removing someone from the
  // allowlist take effect on the next request rather than the next reload.
  await requireAdmin();

  const [roster, cohorts] = await Promise.all([
    getAdminCommittee(),
    getCommitteeCohorts(),
  ]);

  // Grouped by year, newest first - getAdminCommittee already sorts this way.
  const years = new Map<string, typeof roster>();
  for (const person of roster) {
    const group = years.get(person.academicYear) ?? [];
    group.push(person);
    years.set(person.academicYear, group);
  }

  const latestYear = [...years.keys()][0];

  return (
    <>
      <AdminPageHeader
        title="Committee"
        description="The roster on /committee. Past years are kept so the society has a record."
        action={
          <AdminButtonLink href="/admin/committee/new">Add person</AdminButtonLink>
        }
      />

      {roster.length === 0 ? (
        <EmptyState>No committee recorded yet.</EmptyState>
      ) : (
        [...years.entries()].map(([year, people]) => (
          <section key={year} className="mb-10">
            <h2 className="mb-4 flex items-center gap-3 text-[0.65rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
              {year}
              {people.some((person) => person.isCurrent) ? (
                <Badge tone="good">Current</Badge>
              ) : null}
            </h2>

            <AdminTable
              head={
                <>
                  <Th>Role</Th>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th className="text-right">Order</Th>
                  <Th className="text-right">Actions</Th>
                </>
              }
            >
              {people.map((person) => (
                <tr key={person.id}>
                  <Td className="font-medium">{person.role}</Td>

                  <Td>
                    <Link
                      href={`/admin/committee/${person.id}/edit`}
                      className="underline decoration-rule underline-offset-4 hover:decoration-gold"
                    >
                      {person.name}
                    </Link>
                    {person.nameUrdu ? (
                      <span
                        lang="ur"
                        dir="rtl"
                        className="urdu mt-0.5 block text-sm text-ink-muted"
                      >
                        {person.nameUrdu}
                      </span>
                    ) : null}
                  </Td>

                  <Td className="text-xs break-all text-ink-muted">
                    {person.email ?? "-"}
                  </Td>

                  <Td className="text-right whitespace-nowrap">
                    <form action={moveCommitteeMember} className="inline">
                      <input type="hidden" name="id" value={person.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        type="submit"
                        aria-label={`Move ${person.role} up`}
                        className="px-1 text-ink-muted transition-colors hover:text-forest"
                      >
                        ↑
                      </button>
                    </form>
                    <form action={moveCommitteeMember} className="inline">
                      <input type="hidden" name="id" value={person.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        type="submit"
                        aria-label={`Move ${person.role} down`}
                        className="px-1 text-ink-muted transition-colors hover:text-forest"
                      >
                        ↓
                      </button>
                    </form>
                  </Td>

                  <Td className="text-right">
                    <form action={deleteCommitteeMember}>
                      <input type="hidden" name="id" value={person.id} />
                      <DangerConfirm
                        phrase={person.role}
                        openLabel="Remove…"
                        confirmLabel="Remove"
                        pendingLabel="Removing…"
                        description="Type the role to confirm."
                      />
                    </form>
                  </Td>
                </tr>
              ))}
            </AdminTable>

            <CohortEditor year={year} cohort={cohorts.get(year) ?? null} />
          </section>
        ))
      )}

      {latestYear ? (
        <section className="mt-12 max-w-lg border-t border-rule/70 pt-8">
          <h2 className="text-[0.65rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
            Start a new year
          </h2>
          <p className="mt-3 mb-4 text-sm leading-relaxed text-ink-muted">
            Copies the {latestYear} roles into a new year with every name reset to
            “To be announced”, and makes that year the current one. The old year
            stays as a record.
          </p>

          <form action={startNewYear} className="flex flex-col gap-4">
            <input type="hidden" name="fromYear" value={latestYear} />
            <Field label="New academic year" htmlFor="new-year" required>
              <Input
                id="new-year"
                name="academicYear"
                placeholder="2027–28"
                required
              />
            </Field>
            <div>
              <SubmitButton
                variant="outline"
                pendingLabel="Setting up…"
                className="px-5 py-2.5 text-xs"
              >
                Start a new year
              </SubmitButton>
            </div>
          </form>
        </section>
      ) : null}
    </>
  );
}

/**
 * The group photo and note for one year, shown on /committee once that year
 * moves into the archive.
 *
 * Collapsed by default: most years never get one, and an always-open form under
 * every table would bury the roster it belongs to.
 */
function CohortEditor({
  year,
  cohort,
}: {
  year: string;
  cohort: CommitteeCohort | null;
}) {
  const filled = Boolean(cohort?.photoUrl || cohort?.note);

  return (
    <details className="mt-3 border border-rule/70 px-4 py-3" open={false}>
      <summary className="cursor-pointer text-xs text-ink-muted">
        Year photo and note{" "}
        {filled ? (
          <Badge tone="good">Set</Badge>
        ) : (
          <span className="text-ink-muted/70">- none yet</span>
        )}
      </summary>

      <form action={saveCommitteeCohort} className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="academicYear" value={year} />

        <Field
          label="Group photo URL"
          htmlFor={`cohort-photo-${year}`}
          hint="Optional. The archive falls back to the roster alone, which is never wrong."
        >
          <Input
            id={`cohort-photo-${year}`}
            name="photoUrl"
            defaultValue={cohort?.photoUrl ?? ""}
          />
        </Field>

        <Field
          label="Photo description"
          htmlFor={`cohort-alt-${year}`}
          hint="Required if there is a photo - without it the photo is dropped rather than published undescribed."
        >
          <Input
            id={`cohort-alt-${year}`}
            name="photoAlt"
            defaultValue={cohort?.photoAlt ?? ""}
          />
        </Field>

        <Field
          label="Note"
          htmlFor={`cohort-note-${year}`}
          hint="Optional. One line about the year."
        >
          <Textarea
            id={`cohort-note-${year}`}
            name="note"
            rows={2}
            defaultValue={cohort?.note ?? ""}
          />
        </Field>

        <div>
          <SubmitButton
            variant="outline"
            pendingLabel="Saving…"
            className="px-5 py-2.5 text-xs"
          >
            Save {year}
          </SubmitButton>
        </div>
      </form>
    </details>
  );
}
