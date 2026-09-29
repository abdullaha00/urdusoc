"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { members, subscribers } from "@/lib/db/schema";

/**
 * Erasure on request.
 *
 * The privacy policy on /privacy tells people they can "ask to see what we hold
 * about you, correct it, or have it deleted", and promises a committee member
 * will deal with it within a month. Without these the committee would have to
 * open a database console to keep that promise, so the lists are read-only
 * except for this.
 *
 * Unsubscribing is not the same thing: it keeps the row so the address is not
 * re-added by accident. Erasing removes it entirely.
 */

export async function eraseMember(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getDb().delete(members).where(eq(members.id, id));

  redirect("/admin/members");
}

export async function eraseSubscriber(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getDb().delete(subscribers).where(eq(subscribers.id, id));

  redirect("/admin/subscribers");
}
