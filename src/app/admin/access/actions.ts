"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOwner } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { isUniqueViolation, reportUnexpected } from "@/lib/errors";

/**
 * Who may sign in to /admin at all.
 *
 * This is the one screen where a mistake locks the committee out of its own
 * website, so it is owner-only and it refuses to leave the society with zero
 * owners - see `assertNotLastOwner`. Everything else in the admin can be put
 * right by signing in again; this cannot.
 *
 * Results come back as `?error=` / `?ok=` on the page rather than through
 * `useActionState`, matching /login and the OwnerOnly redirect in
 * `src/lib/auth/guard.ts`. The add form is three short fields, so retyping an
 * address on the rare error beats making the whole page a client component.
 */

const ACCESS_PATH = "/admin/access";

const roleSchema = z.enum(["owner", "editor"]);

const newAdminSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("That does not look like an email address.")),
  name: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value || null),
  role: roleSchema,
});

/** The transaction handle `db.transaction` hands to its callback. */
type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

/**
 * Locks every owner row for the rest of the transaction and reports whether
 * `targetId` is the only one left.
 *
 * The lock is the point: two owners removing each other at the same moment
 * would each otherwise see the other as a survivor and both deletes would
 * commit, leaving nobody able to sign in. `FOR UPDATE` cannot be combined with
 * an aggregate in Postgres, so the ids are selected and counted here.
 */
async function isLastOwner(tx: Tx, targetId: string): Promise<boolean> {
  const owners = await tx
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.role, "owner"))
    .for("update");

  return owners.length <= 1 && owners.some((owner) => owner.id === targetId);
}

export async function addAdmin(formData: FormData): Promise<void> {
  const actor = await requireOwner();

  const parsed = newAdminSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") ?? undefined,
    role: formData.get("role"),
  });

  if (!parsed.success) {
    redirect(`${ACCESS_PATH}?error=Invalid`);
  }

  const { email, name, role } = parsed.data;

  try {
    await getDb()
      .insert(admins)
      .values({ email, name, role, addedByEmail: actor.email });
  } catch (error) {
    // Already on the list - harmless, but say so rather than showing the
    // generic failure, since the committee will assume nothing happened.
    if (isUniqueViolation(error, "admins_email_unique")) {
      redirect(`${ACCESS_PATH}?error=Duplicate`);
    }
    reportUnexpected("Add admin failed", error);
    redirect(`${ACCESS_PATH}?error=Unexpected`);
  }

  redirect(`${ACCESS_PATH}?ok=added`);
}

export async function removeAdmin(formData: FormData): Promise<void> {
  await requireOwner();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  let blocked = false;

  try {
    await getDb().transaction(async (tx) => {
      const [target] = await tx
        .select()
        .from(admins)
        .where(eq(admins.id, id))
        .limit(1);

      // Already gone, most likely a double submit. Treat as done.
      if (!target) return;

      if (await isLastOwner(tx, target.id)) {
        blocked = true;
        return;
      }

      await tx.delete(admins).where(eq(admins.id, target.id));
    });
  } catch (error) {
    reportUnexpected("Remove admin failed", error);
    redirect(`${ACCESS_PATH}?error=Unexpected`);
  }

  redirect(
    blocked ? `${ACCESS_PATH}?error=LastOwner` : `${ACCESS_PATH}?ok=removed`,
  );
}

export async function changeAdminRole(formData: FormData): Promise<void> {
  await requireOwner();

  const id = String(formData.get("id") ?? "");
  const role = roleSchema.safeParse(formData.get("role"));
  if (!id || !role.success) return;

  let blocked = false;

  try {
    await getDb().transaction(async (tx) => {
      const [target] = await tx
        .select()
        .from(admins)
        .where(eq(admins.id, id))
        .limit(1);

      if (!target || target.role === role.data) return;

      // Demoting the last owner locks out access management just as surely as
      // deleting them, so it goes through the same gate.
      if (await isLastOwner(tx, target.id)) {
        blocked = true;
        return;
      }

      await tx
        .update(admins)
        .set({ role: role.data })
        .where(eq(admins.id, target.id));
    });
  } catch (error) {
    reportUnexpected("Change admin role failed", error);
    redirect(`${ACCESS_PATH}?error=Unexpected`);
  }

  redirect(blocked ? `${ACCESS_PATH}?error=LastOwner` : `${ACCESS_PATH}?ok=role`);
}
