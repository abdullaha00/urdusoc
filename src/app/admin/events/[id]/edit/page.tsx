import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AdminPageHeader } from "@/components/admin/ui";
import { DangerConfirm } from "@/components/admin/danger-confirm";
import { EventForm } from "@/components/admin/event-form";
import { getAdminEventWithSeats, type AdminEvent } from "@/lib/admin/queries";
import { env } from "@/lib/env";
import {
  formatEventDateWithYear,
  formatEventTime,
  formatPrice,
} from "@/lib/format";
import { deleteEvent } from "../../actions";
import { requireAdmin } from "@/lib/auth/guard";

export const metadata = { title: "Edit event" };

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Guarded here as well as in the layout: a layout is not re-rendered on
  // every navigation, so this is what makes removing someone from the
  // allowlist take effect on the next request rather than the next reload.
  await requireAdmin();

  const { id } = await params;
  const event = await getAdminEventWithSeats(id);

  if (!event) notFound();

  // An event the spreadsheet owns is shown, not edited. Offering a form that
  // saves and is then silently reverted by the next sync would be worse than
  // offering none - see the guards in ../../actions.ts, which enforce this.
  const fromSheet = event.sheetRowKey !== null;

  return (
    <>
      <AdminPageHeader
        title={event.title}
        description={
          event.published
            ? "This event is live on the public site."
            : "This event is a draft - visitors cannot see it."
        }
        backHref="/admin/events"
        backLabel="Events"
        action={
          // The listing, not the event's own page: those are archived for now
          // (see archive/event-pages/README.md), so /events/<slug> would 404.
          event.published ? (
            <Link
              href="/events"
              className="text-xs font-medium text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
            >
              View on site →
            </Link>
          ) : null
        }
      />

      {fromSheet ? (
        <SheetEventView event={event} />
      ) : (
        <>
          <EventForm event={event} />

          <section className="mt-12 max-w-3xl border-t border-rule/70 pt-8">
            <h2 className="text-[0.65rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
              Delete
            </h2>

            {event.seatsTaken > 0 ? (
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                This event has {event.seatsTaken}{" "}
                {event.seatsTaken === 1 ? "place" : "places"} booked, so it
                cannot be deleted - that would take the door list with it.
                Unpublish it instead if you need it off the site.
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
      )}
    </>
  );
}

/**
 * What the last sync read out of the spreadsheet.
 *
 * Deliberately a plain read-only list rather than a disabled copy of the form:
 * a greyed-out form still looks like something you are meant to be able to
 * use, and invites a committee member to go hunting for why they cannot.
 */
function SheetEventView({ event }: { event: AdminEvent }) {
  return (
    <div className="max-w-3xl">
      <div className="rounded-sm border border-gold/40 bg-gold/5 px-5 py-4">
        <p className="text-sm leading-relaxed text-ink">
          <strong className="font-medium">
            This event comes from the committee spreadsheet.
          </strong>{" "}
          To change it, edit the row with the key{" "}
          <code className="rounded-sm bg-paper px-1.5 py-0.5 text-xs">
            {event.sheetRowKey}
          </code>
          {env.eventsSheetUrl ? (
            <>
              {" "}
              in{" "}
              <a
                href={env.eventsSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
              >
                the spreadsheet
              </a>
            </>
          ) : null}
          , then press <strong className="font-medium">Sync now</strong> on the
          events page. Deleting the row unpublishes the event here; it is never
          deleted, so the door list survives.
        </p>
      </div>

      <dl className="mt-8 divide-y divide-rule/70 border-t border-rule/70 text-sm">
        <Row label="Title">{event.title}</Row>
        {event.titleUrdu ? (
          <Row label="Title (Urdu)">
            <span lang="ur" dir="rtl">
              {event.titleUrdu}
            </span>
          </Row>
        ) : null}
        <Row label="Summary">{event.summary}</Row>
        <Row label="When">
          {formatEventDateWithYear(event.startsAt)}
          {event.showTime ? `, ${formatEventTime(event.startsAt)}` : ""}
          {event.endsAt ? ` – ${formatEventTime(event.endsAt)}` : ""}
          {event.showTime ? "" : " (time not set)"}
        </Row>
        <Row label="Venue">{event.venue ?? "Not recorded"}</Row>
        <Row label="Kind">{event.kind}</Row>
        <Row label="Category">{event.category}</Row>
        {event.collaborators.length > 0 ? (
          <Row label="With">{event.collaborators.join(", ")}</Row>
        ) : null}
        <Row label="Sign-up">
          {event.ticketing === "none"
            ? "No booking"
            : `${event.ticketing.toUpperCase()} · ${formatPrice(event.pricePence)}`}
        </Row>
        <Row label="Capacity">
          {event.capacity === null ? "Uncapped" : `${event.capacity} places`}
          {event.ticketing !== "none" ? ` · ${event.seatsTaken} booked` : ""}
        </Row>
        <Row label="Featured">{event.featured ? `Yes (priority ${event.priority})` : "No"}</Row>
        <Row label="Published">{event.published ? "Yes" : "No"}</Row>
        <Row label="Slug">{event.slug}</Row>
        {event.body ? (
          <Row label="Description">
            <span className="whitespace-pre-line">{event.body}</span>
          </Row>
        ) : null}
      </dl>

    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-[0.65rem] font-medium tracking-[0.18em] text-ink-muted uppercase sm:pt-0.5">
        {label}
      </dt>
      <dd className="leading-relaxed">{children}</dd>
    </div>
  );
}
