import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { DangerConfirm } from "@/components/admin/danger-confirm";
import { EventForm } from "@/components/admin/event-form";
import { getAdminEventWithSeats } from "@/lib/admin/queries";
import { deleteEvent } from "../../actions";

export const metadata = { title: "Edit event" };

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getAdminEventWithSeats(id);

  if (!event) notFound();

  return (
    <>
      <AdminPageHeader
        title={event.title}
        description={
          event.published
            ? "This event is live on the public site."
            : "This event is a draft — visitors cannot see it."
        }
        backHref="/admin/events"
        backLabel="Events"
        action={
          event.published ? (
            <Link
              href={`/events/${event.slug}`}
              className="text-xs font-medium text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
            >
              View on site →
            </Link>
          ) : null
        }
      />

      <EventForm event={event} />

      <section className="mt-12 max-w-3xl border-t border-rule/70 pt-8">
        <h2 className="text-[0.65rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
          Delete
        </h2>

        {event.seatsTaken > 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            This event has {event.seatsTaken}{" "}
            {event.seatsTaken === 1 ? "place" : "places"} booked, so it cannot be
            deleted — that would take the door list with it. Unpublish it instead
            if you need it off the site.
          </p>
        ) : (
          <>
            <p className="mt-3 mb-4 text-sm leading-relaxed text-ink-muted">
              Permanent. Unpublishing is usually what you want instead.
            </p>
            <form action={deleteEvent}>
              <input type="hidden" name="id" value={event.id} />
              <DangerConfirm
                phrase={event.slug}
                openLabel="Delete this event…"
                confirmLabel="Delete event"
                description="This cannot be undone."
              />
            </form>
          </>
        )}
      </section>
    </>
  );
}
