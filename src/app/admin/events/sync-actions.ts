"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { changedPublicPages, syncEventsFromSheet } from "@/lib/sheets/sync";

/**
 * "Sync now" on /admin/events.
 *
 * The cron run every fifteen minutes is what normally keeps the site current;
 * this is for the committee member who has just fixed a typo and wants to see
 * it live before they close the tab.
 *
 * Nothing is returned: `syncEventsFromSheet` records the run, and the panel on
 * /admin/events reads it back. That way the scheduled runs and this one are
 * reported through exactly the same path, and a committee member looking at
 * the page tomorrow sees the same detail they would have seen today.
 */
export async function syncEventsNow(): Promise<void> {
  const admin = await requireAdmin();

  const report = await syncEventsFromSheet({
    trigger: "manual",
    actorEmail: admin.email,
  });

  if (changedPublicPages(report)) {
    revalidatePath("/");
    revalidatePath("/events");
  }

  redirect("/admin/events");
}
