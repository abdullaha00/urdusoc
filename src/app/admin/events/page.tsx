import Link from "next/link";
import { FormMessage } from "@/components/form";
import {
  AdminButtonLink,
  AdminPageHeader,
  AdminTable,
  EmptyState,
  PublishBadge,
  Td,
  Th,
} from "@/components/admin/ui";
import { SheetSyncPanel } from "@/components/admin/sheet-sync-panel";
import { getAdminEvents, getLatestSyncRun } from "@/lib/admin/queries";
import { env } from "@/lib/env";
import { formatEventDateWithYear, formatEventTime, isPast } from "@/lib/format";
import { toggleEventPublished } from "./actions";
import { syncEventsNow } from "./sync-actions";
import { requireAdmin } from "@/lib/auth/guard";

export const metadata = { title: "Events" };

const ERRORS: Record<string, string> = {
  "has-registrations":
    "That event has bookings, so it was not deleted. Unpublish it instead, or cancel the bookings first.",
  "sheet-owned":
    "That event comes from the spreadsheet, so it cannot be changed here. Edit its row in the sheet instead.",
};

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Guarded here as well as in the layout: a layout is not re-rendered on
  // every navigation, so this is what makes removing someone from the
  // allowlist take effect on the next request rather than the next reload.
  await requireAdmin();

  const sheetEnabled = env.eventsSheetEnabled;

  const [{ error }, events, syncRun] = await Promise.all([
    searchParams,
    getAdminEvents(),
    getLatestSyncRun(),
  ]);

  const upcoming = events.filter((event) => !isPast(event.startsAt));
  const past = events.filter((event) => isPast(event.startsAt));

  return (
    <>
      <AdminPageHeader
        title="Events"
        description={
          sheetEnabled
            ? "Everything the spreadsheet knows about, drafts included. A row only reaches the public site once its Published column says yes."
            : "Drafts are only visible here. Nothing reaches the public site until you publish it."
        }
        action={
          sheetEnabled ? undefined : (
            <AdminButtonLink href="/admin/events/new">New event</AdminButtonLink>
          )
        }
      />

      {error ? (
        <div className="mb-6">
          <FormMessage tone="error">
            {ERRORS[error] ?? "Something went wrong."}
          </FormMessage>
        </div>
      ) : null}

      <SheetSyncPanel
        run={syncRun}
        enabled={sheetEnabled}
        sheetUrl={env.eventsSheetUrl}
        syncAction={syncEventsNow}
      />

      <section className="mb-10">
        <h2 className="mb-4 text-[0.65rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
          Upcoming
        </h2>
        <EventRows
          events={upcoming}
          empty="No events scheduled. Add one to get it on the site."
        />
      </section>

      <section>
        <h2 className="mb-4 text-[0.65rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
          Past
        </h2>
        <EventRows events={past} empty="Nothing has happened yet." />
      </section>
    </>
  );
}

function EventRows({
  events,
  empty,
}: {
  events: Awaited<ReturnType<typeof getAdminEvents>>;
  empty: string;
}) {
  if (events.length === 0) {
    return <EmptyState>{empty}</EmptyState>;
  }

  return (
    <AdminTable
      head={
        <>
          <Th>Event</Th>
          <Th>When</Th>
          <Th>Booked</Th>
          <Th>State</Th>
          <Th className="text-right">Actions</Th>
        </>
      }
    >
      {events.map((event) => (
        <tr key={event.id}>
          <Td>
            <Link
              href={`/admin/events/${event.id}/edit`}
              className="font-medium underline decoration-rule underline-offset-4 transition-colors hover:decoration-gold"
            >
              {event.title}
            </Link>
            <span className="mt-0.5 block text-xs text-ink-muted">
              {event.venue ?? "Venue not recorded"}
            </span>
          </Td>

          <Td className="whitespace-nowrap text-ink-muted">
            {formatEventDateWithYear(event.startsAt)}
            <span className="mt-0.5 block text-xs">
              {event.showTime ? formatEventTime(event.startsAt) : "Time not set"}
            </span>
          </Td>

          <Td className="whitespace-nowrap">
            {event.ticketing === "none" ? (
              <span className="text-ink-muted">-</span>
            ) : (
              <Link
                href={`/admin/events/${event.id}/registrations`}
                className="underline decoration-rule underline-offset-4 hover:decoration-gold"
              >
                {event.seatsTaken}
                {event.capacity !== null ? ` / ${event.capacity}` : ""}
              </Link>
            )}
          </Td>

          <Td>
            <PublishBadge published={event.published} />
          </Td>

          <Td className="text-right whitespace-nowrap">
            {event.sheetRowKey ? (
              // The sheet owns `published` for this row. A toggle here would
              // be undone by the next sync fifteen minutes later, which is a
              // worse experience than not offering it.
              <span className="text-xs text-ink-muted">
                from sheet · {event.sheetRowKey}
              </span>
            ) : (
              <form action={toggleEventPublished} className="inline">
                <input type="hidden" name="id" value={event.id} />
                <button
                  type="submit"
                  className="text-xs font-medium text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:decoration-forest"
                >
                  {event.published ? "Unpublish" : "Publish"}
                </button>
              </form>
            )}
          </Td>
        </tr>
      ))}
    </AdminTable>
  );
}
