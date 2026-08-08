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
import { Field, Input, SubmitButton } from "@/components/form";
import { getAdminCommittee } from "@/lib/admin/queries";
import {
  deleteCommitteeMember,
  moveCommitteeMember,
  startNewYear,
} from "./actions";

export const metadata = { title: "Committee" };

export default async function AdminCommitteePage() {
  const roster = await getAdminCommittee();

  // Grouped by year, newest first — getAdminCommittee already sorts this way.
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
                    {person.email ?? "—"}
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
          </section>
        ))
      )}

      {latestYear ? (
        <section className="mt-12 max-w-lg border-t border-rule/70 pt-8">
          <h2 className="text-[0.65rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
            Handover
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
