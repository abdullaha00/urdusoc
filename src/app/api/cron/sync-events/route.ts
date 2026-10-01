/**
 * The scheduled sheet sync.
 *
 * Called by Vercel Cron on the schedule in vercel.json. Vercel sends
 * `Authorization: Bearer $CRON_SECRET`, which is the only thing standing
 * between this route and anyone on the internet triggering a sync - so the
 * check below refuses the request outright when the secret is unset, rather
 * than treating "no secret configured" as "no secret required".
 *
 * The committee never touches this. The button in /admin/events runs the same
 * code through a server action, behind the ordinary admin guard.
 */

import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";
import { changedPublicPages, syncEventsFromSheet } from "@/lib/sheets/sync";

/** A sheet with a hundred events is still well inside this. */
export const maxDuration = 60;

function secretMatches(header: string | null, secret: string): boolean {
  if (!header?.startsWith("Bearer ")) return false;

  const provided = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(secret);

  // timingSafeEqual throws on a length mismatch, which would itself leak the
  // length, so that case is answered with a constant-time comparison against
  // the expected value instead.
  if (provided.length !== expected.length) {
    timingSafeEqual(expected, expected);
    return false;
  }

  return timingSafeEqual(provided, expected);
}

export async function GET(request: Request): Promise<Response> {
  const secret = env.cronSecret;

  if (!secret) {
    console.error("CRON_SECRET is not set - refusing to run the event sync.");
    return Response.json(
      { ok: false, error: "Not configured." },
      { status: 503 },
    );
  }

  if (!secretMatches(request.headers.get("authorization"), secret)) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const report = await syncEventsFromSheet({ trigger: "cron" });

  if (changedPublicPages(report)) {
    revalidatePath("/");
    revalidatePath("/events");
  }

  // A failed sync returns 500 so it shows as a failure in the Vercel cron log
  // rather than passing quietly. The report is in the body either way, and in
  // `event_sync_runs` for /admin/events.
  return Response.json(report, { status: report.ok ? 200 : 500 });
}
