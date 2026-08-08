import {
  AdminPageHeader,
  AdminTable,
  Badge,
  EmptyState,
  Td,
  Th,
} from "@/components/admin/ui";
import { DangerConfirm } from "@/components/admin/danger-confirm";
import { getSubscriberTotals, getSubscribers } from "@/lib/admin/queries";
import { formatMonthYear } from "@/lib/format";
import { eraseSubscriber } from "../people-actions";

export const metadata = { title: "Mailing list" };

const STATUS_TONES = {
  confirmed: "good",
  pending: "warn",
  unsubscribed: "neutral",
} as const;

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const filters = await searchParams;
  const [subscribers, totals] = await Promise.all([
    getSubscribers(filters),
    getSubscriberTotals(),
  ]);

  const filtered = Boolean(filters.q || filters.status);
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => Boolean(value)) as [
      string,
      string,
    ][],
  ).toString();

  return (
    <>
      <AdminPageHeader
        title="Mailing list"
        description="Only confirmed addresses have opted in. Pending ones never clicked the confirmation link and must not be emailed."
        action={
          subscribers.length > 0 ? (
            <a
              href={`/admin/subscribers/export${query ? `?${query}` : ""}`}
              className="text-xs font-medium text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
            >
              Download CSV
            </a>
          ) : null
        }
      />

      <p className="mb-6 text-sm text-ink-muted">
        <span className="font-medium text-ink">{totals.confirmed}</span> confirmed
        · {totals.pending} awaiting confirmation · {totals.unsubscribed}{" "}
        unsubscribed
      </p>

      <form className="mb-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.65rem] font-medium tracking-[0.18em] text-ink-muted uppercase">
            Search
          </span>
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Email"
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
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="unsubscribed">Unsubscribed</option>
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
            href="/admin/subscribers"
            className="pb-2 text-xs text-ink-muted underline underline-offset-4"
          >
            Clear
          </a>
        ) : null}
      </form>

      {subscribers.length === 0 ? (
        <EmptyState>
          {filtered ? "Nobody matches that filter." : "Nobody has signed up yet."}
        </EmptyState>
      ) : (
        <AdminTable
          head={
            <>
              <Th>Email</Th>
              <Th>Status</Th>
              <Th>Signed up via</Th>
              <Th>Confirmed</Th>
              <Th className="text-right">Erase</Th>
            </>
          }
        >
          {subscribers.map((subscriber) => (
            <tr key={subscriber.id}>
              <Td className="break-all">{subscriber.email}</Td>
              <Td>
                <Badge tone={STATUS_TONES[subscriber.status]}>
                  {subscriber.status}
                </Badge>
              </Td>
              <Td className="text-ink-muted">{subscriber.source ?? "—"}</Td>
              <Td className="whitespace-nowrap text-ink-muted">
                {subscriber.confirmedAt
                  ? formatMonthYear(subscriber.confirmedAt)
                  : "—"}
              </Td>
              <Td className="text-right">
                <form action={eraseSubscriber}>
                  <input type="hidden" name="id" value={subscriber.id} />
                  <DangerConfirm
                    phrase={subscriber.email}
                    openLabel="Erase…"
                    confirmLabel="Erase address"
                    pendingLabel="Erasing…"
                    description="For a data-removal request. Type the address to confirm."
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
