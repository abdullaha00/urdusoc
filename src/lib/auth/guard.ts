import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { admins, type Admin } from "@/lib/db/schema";

/**
 * The real authorization check. Call this at the top of every admin page and at
 * the top of every admin server action - never rely on `proxy.ts`, which only
 * does an optimistic cookie check and cannot be trusted for access control.
 *
 * The allowlist is re-read on every call, so removing someone takes effect
 * immediately even if their session cookie is still valid.
 */
export async function requireAdmin(): Promise<Admin> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    redirect("/login");
  }

  const [admin] = await getDb()
    .select()
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1);

  if (!admin) {
    // Signed in, but no longer on the allowlist - e.g. removed by an owner.
    redirect("/login?error=AccessDenied");
  }

  return admin;
}

/** Owners can additionally manage who else has access. */
export async function requireOwner(): Promise<Admin> {
  const admin = await requireAdmin();
  if (admin.role !== "owner") {
    redirect("/admin?error=OwnerOnly");
  }
  return admin;
}

/** Returns the signed-in admin, or null. Never redirects. */
export async function getCurrentAdmin(): Promise<Admin | null> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;

  const [admin] = await getDb()
    .select()
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1);

  return admin ?? null;
}
