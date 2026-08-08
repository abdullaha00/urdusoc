import { notFound } from "next/navigation";
import {
  AdminPageHeader,
  AdminTable,
  Badge,
  EmptyState,
  Td,
  Th,
} from "@/components/admin/ui";
import { DangerConfirm } from "@/components/admin/danger-confirm";
import { getAdminEventWithSeats, getRegistrations } from "@/lib/admin/queries";
import { formatEventDateWithYear, formatEventTime } from "@/lib/format";
import { cancelRegistration, eraseRegistration, toggleCheckIn } from "../../actions";

export const metadata = { title: "Door list" };

export default async function RegistrationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getAdminEventWithSeats(id);

  if (!event) notFound();

  const registrations = await getRegistrations(id);
  const live = registrations.filter((row) => row.status !== "cancelled");
  const checkedIn = live.filter((row) => row.checkedInAt !== null).length;

  return (
    <>
      <AdminPageHeader
        title="Door list"
        description={`${event.title} — ${formatEventDateWithYear(event.startsAt)} at ${formatEventTime(event.startsAt)}`}
        backHref="/admin/events"
        backLabel="Events"
        action={
          registrations.length > 0 ? (
            <a
              href={`/admin/events/${event.id}/registrations/export`}
              className="text-xs font-medium text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
            >
              Download CSV
            </a>
          ) : null
        }
      />

      <p className="mb-6 text-sm text-ink-muted">
        <span className="font-medium text-ink">{event.seatsTaken}</span>{" "}
        {event.seatsTaken === 1 ? "place" : "places"} booked
        {event.capacity !== null ? ` of ${event.capacity}` : " (uncapped)"} ·{" "}
        <span className="font-medium text-ink">{checkedIn}</span> of {live.length}{" "}
        {live.length === 1 ? "booking" : "bookings"} checked in
      </p>

      {registrations.length === 0 ? (
        <EmptyState>
          Nobody has booked yet.
          {event.ticketing === "none"
            ? " This event does not take bookings."
            : null}
        </EmptyState>
      ) : (
        <AdminTable
          head={
            <>
              <Th>Name</Th>
              <Th>Reference</Th>
              <Th>Places</Th>
              <Th>State</Th>
              <Th className="text-right">At the door</Th>
            </>
          }
        >
          {registrations.map((row) => {
            const cancelled = row.status === "cancelled";
            return (
              <tr key={row.id} className={cancelled ? "opacity-55" : undefined}>
                <Td>
                  <span className="font-medium">{row.name}</span>
                  <span className="mt-0.5 block text-xs break-all text-ink-muted">
                    {row.email}
                  </span>
                  {row.notes ? (
                    <span className="mt-1 block max-w-md text-xs leading-relaxed text-ink-muted italic">
                      “{row.notes}”
                    </span>
                  ) : null}
                </Td>

                <Td className="font-mono text-xs tracking-wider whitespace-nowrap">
                  {row.reference}
                </Td>

                <Td>{row.quantity}</Td>

                <Td>
                  {cancelled ? (
                    <Badge tone="bad">Cancelled</Badge>
                  ) : row.checkedInAt ? (
                    <Badge tone="good">Checked in</Badge>
                  ) : (
                    <Badge>Reserved</Badge>
                  )}
                </Td>

                <Td className="text-right whitespace-nowrap">
                  {cancelled ? null : (
                    <form action={toggleCheckIn} className="inline">
                      <input type="hidden" name="registrationId" value={row.id} />
                      <input type="hidden" name="eventId" value={event.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:decoration-forest"
                      >
                        {row.checkedInAt ? "Undo" : "Check in"}
                      </button>
                    </form>
                  )}

                  {cancelled ? null : (
                    <form action={cancelRegistration} className="mt-1 block">
                      <input type="hidden" name="registrationId" value={row.id} />
                      <input type="hidden" name="eventId" value={event.id} />
                      <button
                        type="submit"
                        className="text-xs text-ink-muted underline underline-offset-4 transition-colors hover:text-wine"
                      >
                        Cancel booking
                      </button>
                    </form>
                  )}

                  <div className="mt-2">
                    <form action={eraseRegistration}>
                      <input type="hidden" name="registrationId" value={row.id} />
                      <input type="hidden" name="eventId" value={event.id} />
                      <DangerConfirm
                        phrase={row.email}
                        openLabel="Erase…"
                        confirmLabel="Erase booking"
                        pendingLabel="Erasing…"
                        description="Removes the booking and its personal details entirely, for a data-removal request."
                      />
                    </form>
                  </div>
                </Td>
              </tr>
            );
          })}
        </AdminTable>
      )}
    </>
  );
}
