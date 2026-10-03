import { AdminPageHeader } from "@/components/admin/ui";
import { EventForm } from "@/components/admin/event-form";
import { env } from "@/lib/env";
import { requireAdmin } from "@/lib/auth/guard";

export const metadata = { title: "New event" };

export default async function NewEventPage() {
  // Guarded here as well as in the layout: a layout is not re-rendered on
  // every navigation, so this is what makes removing someone from the
  // allowlist take effect on the next request rather than the next reload.
  await requireAdmin();

  // With the spreadsheet connected, this page is only reachable by an old
  // bookmark - /admin/events stops linking to it. Say where to go rather than
  // 404ing, and rather than offering a form whose save would be refused.
  if (env.eventsSheetEnabled) {
    return (
      <>
        <AdminPageHeader
          title="New event"
          description="Events are added in the committee spreadsheet."
          backHref="/admin/events"
          backLabel="Events"
        />

        <div className="max-w-2xl rounded-sm border border-rule px-5 py-5 text-sm leading-relaxed text-ink-muted">
          <p>
            Add a row to the spreadsheet, give it a{" "}
            <strong className="font-medium text-ink">Key</strong> nothing else
            uses, and fill in at least the title, summary and date. The date
            may be <em>TBC</em>. Set{" "}
            <strong className="font-medium text-ink">Published</strong> to{" "}
            <em>yes</em> when it is ready to go out - the site picks it up
            within fifteen minutes, or straight away if you press{" "}
            <strong className="font-medium text-ink">Sync now</strong>.
          </p>

          {env.eventsSheetUrl ? (
            <p className="mt-4">
              <a
                href={env.eventsSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
              >
                Open the spreadsheet →
              </a>
            </p>
          ) : null}
        </div>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title="New event"
        description="It stays a draft until you tick publish, so you can write it now and release it later."
        backHref="/admin/events"
        backLabel="Events"
      />
      <EventForm />
    </>
  );
}
