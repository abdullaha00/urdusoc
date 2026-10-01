/**
 * The state of the Google Sheet sync, at the top of /admin/events.
 *
 * This is the only place the committee is told that the spreadsheet - not this
 * page - is where events are written. It has to carry that without a manual,
 * so it says where to type, when the site last caught up, and exactly which
 * spreadsheet rows were refused and why.
 */

import { SubmitButton } from "@/components/form";
import { Badge } from "@/components/admin/ui";
import type { EventSyncRun } from "@/lib/db/schema";

function formatWhen(date: Date): string {
  const minutesAgo = Math.round((Date.now() - date.getTime()) / 60_000);

  if (minutesAgo < 1) return "just now";
  if (minutesAgo === 1) return "1 minute ago";
  if (minutesAgo < 60) return `${minutesAgo} minutes ago`;

  const hoursAgo = Math.round(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo} ${hoursAgo === 1 ? "hour" : "hours"} ago`;

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Europe/London",
  }).format(date);
}

/** "2 added, 1 updated" - and "no changes" rather than a row of zeroes. */
function summarise(run: EventSyncRun): string {
  const parts: string[] = [];
  if (run.created) parts.push(`${run.created} added`);
  if (run.updated) parts.push(`${run.updated} updated`);
  if (run.unpublished) {
    parts.push(
      `${run.unpublished} unpublished (${
        run.unpublished === 1 ? "its row is" : "their rows are"
      } no longer in the sheet)`,
    );
  }

  if (parts.length === 0) {
    return `${run.rowsRead} ${run.rowsRead === 1 ? "row" : "rows"} read, no changes`;
  }

  return parts.join(", ");
}

export function SheetSyncPanel({
  run,
  enabled,
  sheetUrl,
  syncAction,
}: {
  run: EventSyncRun | null;
  /** False when the three environment variables are not all set. */
  enabled: boolean;
  /** Null when EVENTS_SHEET_ID is unset - the heading then has no link. */
  sheetUrl: string | null;
  syncAction: () => Promise<void>;
}) {
  if (!enabled) {
    return (
      <div className="mb-8 rounded-sm border border-dashed border-rule px-5 py-4">
        <p className="text-sm leading-relaxed text-ink-muted">
          <strong className="font-medium text-ink">
            The events spreadsheet is not connected.
          </strong>{" "}
          Until it is, events are written here by hand. Connecting it needs
          three environment variables - see <code>.env.example</code>, or the
          Events section of the README.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="sheet-sync-heading"
      className="mb-8 rounded-sm border border-rule bg-paper px-5 py-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h2
            id="sheet-sync-heading"
            className="text-[0.65rem] font-medium tracking-[0.22em] text-ink-muted uppercase"
          >
            Events spreadsheet
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Events are written in{" "}
            {sheetUrl ? (
              <a
                href={sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:decoration-forest"
              >
                the committee spreadsheet
              </a>
            ) : (
              "the committee spreadsheet"
            )}
            , not on this page. The site catches up once a day, or now if you
            press Sync.
            Everything below is a copy - to change an event, change its row.
          </p>
        </div>

        <form action={syncAction} className="shrink-0">
          <SubmitButton variant="outline" pendingLabel="Syncing…" className="px-5 py-2.5 text-xs">
            Sync now
          </SubmitButton>
        </form>
      </div>

      <div className="mt-4 border-t border-rule/70 pt-3">
        {run === null ? (
          <p className="text-sm text-ink-muted">
            Not run yet. Press <strong className="font-medium">Sync now</strong>{" "}
            to bring the events across for the first time.
          </p>
        ) : (
          <>
            <p className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
              <Badge tone={run.ok ? "good" : "bad"}>
                {run.ok ? "Synced" : "Failed"}
              </Badge>
              <span>
                {formatWhen(run.startedAt)}
                {run.trigger === "manual" && run.triggeredByEmail
                  ? ` · by ${run.triggeredByEmail}`
                  : ""}
              </span>
            </p>

            {run.ok ? (
              <p className="mt-2 text-sm text-ink-muted">{summarise(run)}.</p>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-wine">
                {run.errorMessage ?? "The sync failed."}
              </p>
            )}

            {run.problems.length > 0 ? (
              <details className="mt-3" open>
                <summary className="cursor-pointer text-sm font-medium text-wine">
                  {run.problems.length}{" "}
                  {run.problems.length === 1 ? "row was" : "rows were"} skipped
                </summary>
                <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink-muted">
                  {run.problems.map((problem) => (
                    <li key={problem} className="border-l-2 border-wine/30 pl-3">
                      {problem}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-ink-muted">
                  These events are not on the site. Fix the rows in the
                  spreadsheet and sync again.
                </p>
              </details>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
