"use server";

import { and, asc, desc, eq, gt, lt, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { committee } from "@/lib/db/schema";
import { reportUnexpected } from "@/lib/errors";

export type CommitteeFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

const memberSchema = z.object({
  name: z.string().trim().min(1, "Please give a name.").max(120),
  nameUrdu: z.string().trim().max(120).optional().transform((v) => v || null),
  role: z.string().trim().min(1, "Which role?").max(120),
  bio: z.string().trim().max(800).optional().transform((v) => v || null),
  email: z
    .union([z.literal(""), z.string().trim().toLowerCase().pipe(z.email("That does not look like an email address."))])
    .optional()
    .transform((v) => (v ? v : null)),
  academicYear: z.string().trim().min(1, "Which year?").max(20),
  isCurrent: z.boolean(),
  orderIndex: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number(value) : 0))
    .refine((value) => Number.isInteger(value), "Order must be a whole number."),
});

export async function saveCommitteeMember(
  _previous: CommitteeFormState,
  formData: FormData,
): Promise<CommitteeFormState> {
  await requireAdmin();

  const parsed = memberSchema.safeParse({
    name: formData.get("name"),
    nameUrdu: formData.get("nameUrdu") ?? undefined,
    role: formData.get("role"),
    bio: formData.get("bio") ?? undefined,
    email: formData.get("email") ?? undefined,
    academicYear: formData.get("academicYear"),
    isCurrent: formData.get("isCurrent") === "on",
    orderIndex: formData.get("orderIndex") ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", message: "Please check the form.", fieldErrors };
  }

  const id = String(formData.get("id") ?? "").trim();

  try {
    if (id) {
      await getDb().update(committee).set(parsed.data).where(eq(committee.id, id));
    } else {
      await getDb().insert(committee).values(parsed.data);
    }
  } catch (error) {
    return {
      status: "error",
      message: reportUnexpected("Save committee member failed", error),
    };
  }

  redirect("/admin/committee");
}

/**
 * Swaps a row with its neighbour in the same year.
 *
 * `orderIndex` is not unique and the seed leaves gaps, so this finds the
 * adjacent row by ordering rather than by arithmetic on the index.
 */
export async function moveCommitteeMember(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) return;

  const db = getDb();

  await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(committee)
      .where(eq(committee.id, id))
      .limit(1);
    if (!row) return;

    const [neighbour] = await tx
      .select()
      .from(committee)
      .where(
        and(
          eq(committee.academicYear, row.academicYear),
          ne(committee.id, row.id),
          direction === "up"
            ? lt(committee.orderIndex, row.orderIndex)
            : gt(committee.orderIndex, row.orderIndex),
        ),
      )
      .orderBy(
        direction === "up"
          ? desc(committee.orderIndex)
          : asc(committee.orderIndex),
      )
      .limit(1);

    if (!neighbour) return;

    await tx
      .update(committee)
      .set({ orderIndex: neighbour.orderIndex })
      .where(eq(committee.id, row.id));
    await tx
      .update(committee)
      .set({ orderIndex: row.orderIndex })
      .where(eq(committee.id, neighbour.id));
  });

  redirect("/admin/committee");
}

export async function deleteCommitteeMember(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getDb().delete(committee).where(eq(committee.id, id));

  redirect("/admin/committee");
}

/**
 * Handover: copies this year's roles into a new year with the names cleared.
 *
 * The roles rarely change between committees but the people always do, so the
 * roles are kept and each name is reset to the seed's "To be announced" — which
 * is what /committee already renders gracefully.
 */
export async function startNewYear(formData: FormData): Promise<void> {
  await requireAdmin();

  const newYear = String(formData.get("academicYear") ?? "").trim();
  const fromYear = String(formData.get("fromYear") ?? "").trim();
  if (!newYear || !fromYear) return;

  const db = getDb();

  await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(committee)
      .where(eq(committee.academicYear, newYear))
      .limit(1);

    // Already started — don't duplicate the roster on a double submit.
    if (existing.length > 0) return;

    const previous = await tx
      .select()
      .from(committee)
      .where(eq(committee.academicYear, fromYear))
      .orderBy(asc(committee.orderIndex));

    if (previous.length === 0) return;

    await tx.insert(committee).values(
      previous.map((person) => ({
        name: "To be announced",
        nameUrdu: null,
        role: person.role,
        bio: null,
        email: null,
        photoUrl: null,
        academicYear: newYear,
        isCurrent: true,
        orderIndex: person.orderIndex,
      })),
    );

    // Only one year is "current" at a time.
    await tx
      .update(committee)
      .set({ isCurrent: false })
      .where(ne(committee.academicYear, newYear));
  });

  redirect("/admin/committee");
}
