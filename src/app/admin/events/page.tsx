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
import { getAdminEvents } from "@/lib/admin/queries";
import { formatEventDateWithYear, formatEventTime, isPast } from "@/lib/format";
import { toggleEventPublished } from "./actions";

export const metadata = { title: "Events" };

const ERRORS: Record<string, string> = {
  "has-registrations":
    "That event has bookings, so it was not deleted. Unpublish it instead, or cancel the bookings first.",
};

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, events] = await Promise.all([
    searchParams,
    getAdminEvents(),
  ]);

  const upcoming = events.filter((event) => !isPast(event.startsAt));
  const past = events.filter((event) => isPast(event.startsAt));

  return (
    <>
      <AdminPageHeader
        title="Events"
        description="Drafts are only visible here. Nothing reaches the public site until you publish it."
        action={<AdminButtonLink href="/admin/events/new">New event</AdminButtonLink>}
      />

      {error ? (
        <div className="mb-6">
          <FormMessage tone="error">
            {ERRORS[error] ?? "Something went wrong."}
          </FormMessage>
        </div>
      ) : null}

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
              {event.venue}
            </span>
          </Td>

          <Td className="whitespace-nowrap text-ink-muted">
            {formatEventDateWithYear(event.startsAt)}
            <span className="mt-0.5 block text-xs">
              {formatEventTime(event.startsAt)}
            </span>
          </Td>

          <Td className="whitespace-nowrap">
            {event.ticketing === "none" ? (
              <span className="text-ink-muted">—</span>
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
            <form action={toggleEventPublished} className="inline">
              <input type="hidden" name="id" value={event.id} />
              <button
                type="submit"
                className="text-xs font-medium text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:decoration-forest"
              >
                {event.published ? "Unpublish" : "Publish"}
              </button>
            </form>
          </Td>
        </tr>
      ))}
    </AdminTable>
  );
}
