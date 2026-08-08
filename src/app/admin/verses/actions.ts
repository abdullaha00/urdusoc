"use server";

import { eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { verses } from "@/lib/db/schema";
import { reportUnexpected } from "@/lib/errors";

export type VerseFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

/** A textarea of one line per couplet line, blank lines dropped. */
const lines = (label: string) =>
  z
    .string()
    .transform((value) =>
      value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .refine((value) => value.length > 0, `Please give the ${label}.`)
    .refine((value) => value.length <= 12, "That is more lines than a couplet.");

const verseSchema = z.object({
  urduLines: lines("Urdu lines"),
  transliterationLines: lines("transliteration"),
  translation: z.string().trim().min(1, "Please give a translation.").max(600),
  poetName: z.string().trim().min(1, "Who wrote it?").max(120),
  poetUrdu: z.string().trim().max(120).optional().transform((v) => v || null),
  poetYears: z.string().trim().max(40).optional().transform((v) => v || null),
  note: z.string().trim().max(600).optional().transform((v) => v || null),
  featured: z.boolean(),
});

export async function saveVerse(
  _previous: VerseFormState,
  formData: FormData,
): Promise<VerseFormState> {
  await requireAdmin();

  const parsed = verseSchema.safeParse({
    urduLines: formData.get("urduLines") ?? "",
    transliterationLines: formData.get("transliterationLines") ?? "",
    translation: formData.get("translation"),
    poetName: formData.get("poetName"),
    poetUrdu: formData.get("poetUrdu") ?? undefined,
    poetYears: formData.get("poetYears") ?? undefined,
    note: formData.get("note") ?? undefined,
    featured: formData.get("featured") === "on",
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
  const data = parsed.data;

  try {
    // One transaction so the site is never left with two featured couplets —
    // `getFeaturedVerse()` takes the first it finds, which would otherwise be
    // whichever the database happened to return.
    await getDb().transaction(async (tx) => {
      if (id) {
        await tx.update(verses).set(data).where(eq(verses.id, id));
        if (data.featured) {
          await tx
            .update(verses)
            .set({ featured: false })
            .where(ne(verses.id, id));
        }
      } else {
        const [created] = await tx.insert(verses).values(data).returning({
          id: verses.id,
        });
        if (data.featured && created) {
          await tx
            .update(verses)
            .set({ featured: false })
            .where(ne(verses.id, created.id));
        }
      }
    });
  } catch (error) {
    return { status: "error", message: reportUnexpected("Save verse failed", error) };
  }

  redirect("/admin/verses");
}

/** Promotes one couplet to the homepage, demoting whatever was there. */
export async function setFeaturedVerse(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getDb().transaction(async (tx) => {
    await tx.update(verses).set({ featured: false }).where(ne(verses.id, id));
    await tx.update(verses).set({ featured: true }).where(eq(verses.id, id));
  });

  redirect("/admin/verses");
}

export async function deleteVerse(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getDb().delete(verses).where(eq(verses.id, id));

  redirect("/admin/verses");
}
