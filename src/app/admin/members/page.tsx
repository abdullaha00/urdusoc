import {
  AdminPageHeader,
  AdminTable,
  Badge,
  EmptyState,
  Td,
  Th,
} from "@/components/admin/ui";
import { DangerConfirm } from "@/components/admin/danger-confirm";
import { getMembers, getMemberTotals } from "@/lib/admin/queries";
import { formatMonthYear } from "@/lib/format";
import { eraseMember } from "../people-actions";

export const metadata = { title: "Members" };

const STATUS_TONES = {
  active: "good",
  pending: "warn",
  expired: "neutral",
} as const;

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string }>;
}) {
  const filters = await searchParams;
  const [members, totals] = await Promise.all([
    getMembers(filters),
    getMemberTotals(),
  ]);

  const filtered = Boolean(filters.q || filters.status || filters.type);

  return (
    <>
      <AdminPageHeader
        title="Members"
        description="Everyone who has joined. Read-only, apart from erasing someone who asks."
        action={
          members.length > 0 ? (
            <a
              href={`/admin/members/export${buildQuery(filters)}`}
              className="text-xs font-medium text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
            >
              Download CSV
            </a>
          ) : null
        }
      />

      <p className="mb-6 text-sm text-ink-muted">
        <span className="font-medium text-ink">{totals.active}</span> active ·{" "}
        {totals.pending} pending · {totals.expired} expired ·{" "}
        <span className="font-medium text-ink">{totals.all}</span> in total
      </p>

      {/* A plain GET form: the filter lives in the URL, so a filtered list can
          be bookmarked and the CSV link inherits it. */}
      <form className="mb-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.65rem] font-medium tracking-[0.18em] text-ink-muted uppercase">
            Search
          </span>
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Name, email or CRSid"
            className="w-56 rounded-sm border border-rule bg-paper px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.65rem] font-medium tracking-[0.18em] text-ink-muted uppercase">
            Status
          </span>
          <select
            name="status"
            defaultValue={filters.status ?? ""}
            className="rounded-sm border border-rule bg-paper px-3 py-2 text-sm focus:border-gold focus:outline-none"
          >
            <option value="">Any</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.65rem] font-medium tracking-[0.18em] text-ink-muted uppercase">
            Type
          </span>
          <select
            name="type"
            defaultValue={filters.type ?? ""}
            className="rounded-sm border border-rule bg-paper px-3 py-2 text-sm focus:border-gold focus:outline-none"
          >
            <option value="">Any</option>
            <option value="student">Student</option>
            <option value="alumni">Alumni</option>
            <option value="friend">Friend</option>
          </select>
        </label>

        <button
          type="submit"
          className="rounded-full border border-forest/25 px-4 py-2 text-xs font-medium text-forest transition-colors hover:bg-forest/5"
        >
          Filter
        </button>

        {filtered ? (
          <a
            href="/admin/members"
            className="pb-2 text-xs text-ink-muted underline underline-offset-4"
          >
            Clear
          </a>
        ) : null}
      </form>

      {members.length === 0 ? (
        <EmptyState>
          {filtered ? "Nobody matches that filter." : "Nobody has joined yet."}
        </EmptyState>
      ) : (
        <AdminTable
          head={
            <>
              <Th>Name</Th>
              <Th>CRSid</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Joined</Th>
              <Th className="text-right">Erase</Th>
            </>
          }
        >
          {members.map((member) => (
            <tr key={member.id}>
              <Td>
                <span className="font-medium">{member.name}</span>
                <span className="mt-0.5 block text-xs break-all text-ink-muted">
                  {member.email}
                </span>
              </Td>
              <Td className="text-ink-muted">{member.crsid ?? "—"}</Td>
              <Td className="capitalize">{member.type}</Td>
              <Td>
                <Badge tone={STATUS_TONES[member.status]}>{member.status}</Badge>
              </Td>
              <Td className="whitespace-nowrap text-ink-muted">
                {member.joinedAt ? formatMonthYear(member.joinedAt) : "—"}
              </Td>
              <Td className="text-right">
                <form action={eraseMember}>
                  <input type="hidden" name="id" value={member.id} />
                  <DangerConfirm
                    phrase={member.email}
                    openLabel="Erase…"
                    confirmLabel="Erase member"
                    pendingLabel="Erasing…"
                    description="For a data-removal request. Type their email to confirm."
                  />
                </form>
              </Td>
            </tr>
          ))}
        </AdminTable>
      )}
    </>
  );
}

/** Carries the current filter through to the CSV link. */
function buildQuery(filters: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
