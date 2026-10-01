import Link from "next/link";
import { AdminPageHeader, Stat } from "@/components/admin/ui";
import { FormMessage } from "@/components/form";
import { getDashboardSummary } from "@/lib/admin/queries";
import { formatEventDateWithYear, formatEventTime } from "@/lib/format";

export const metadata = { title: "Overview" };

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminHomePage({ searchParams }: PageProps) {
  const [summary, { error }] = await Promise.all([
    getDashboardSummary(),
    searchParams,
  ]);
  const { nextEvent } = summary;

  return (
    <>
      <AdminPageHeader
        title="Overview"
        description="Everything the committee can change without touching code."
      />

      {/* Where `requireOwner()` sends an editor who reaches an owner-only page.
          Without this the redirect would land silently and look like a bug. */}
      {error === "OwnerOnly" ? (
        <div className="mb-8">
          <FormMessage tone="error">
            That page is for owners only. Ask an owner to make the change, or to
            make you an owner.
          </FormMessage>
        </div>
      ) : null}

      <section className="mb-10">
        <h2 className="mb-4 text-[0.65rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
          Next event
        </h2>

        {nextEvent ? (
          <div className="rounded-sm border border-rule bg-paper px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link
                  href={`/admin/events/${nextEvent.id}/edit`}
                  className="font-serif text-2xl leading-tight underline decoration-rule underline-offset-4 transition-colors hover:decoration-gold"
                >
                  {nextEvent.title}
                </Link>
                <p className="mt-2 text-sm text-ink-muted">
                  {formatEventDateWithYear(nextEvent.startsAt)}
                  {nextEvent.showTime
                    ? ` at ${formatEventTime(nextEvent.startsAt)}`
                    : null}
                  {nextEvent.venue ? ` · ${nextEvent.venue}` : null}
                </p>
              </div>

            </div>

            {!nextEvent.published ? (
              <p className="mt-4 text-sm text-ink-muted">Not published yet.</p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-sm border border-dashed border-rule px-6 py-10 text-center text-sm text-ink-muted">
            Nothing scheduled.{" "}
            <Link
              href="/admin/events/new"
              className="font-medium text-forest underline underline-offset-4"
            >
              Add an event
            </Link>
            .
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-[0.65rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
          The society
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat
            label="Unpublished events"
            value={summary.draftEvents}
            hint={
              summary.draftEvents > 0
                ? "Drafts are invisible to visitors."
                : "Nothing sitting in draft."
            }
            href="/admin/events"
          />
          <Stat
            label="Couplets"
            value={summary.verseCount}
            hint="One is featured on the homepage."
            href="/admin/verses"
          />
          <Stat
            label="Unpublished albums"
            value={summary.unpublishedAlbums}
            hint={
              summary.unpublishedAlbums > 0
                ? "Not yet on the gallery."
                : "All albums are live."
            }
            href="/admin/gallery"
          />
        </div>
      </section>
    </>
  );
}
