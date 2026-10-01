"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { albums } from "@/lib/db/schema";
import { isUniqueViolation, reportUnexpected } from "@/lib/errors";
import { parseLondonDateTime } from "@/lib/format";
import { MOTIF_VALUES } from "@/lib/motifs";
import { slugify } from "@/lib/slug";

export type AlbumFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

const albumSchema = z.object({
  title: z.string().trim().min(1, "Please give the album a title.").max(200),
  slug: z.string().trim().max(120).optional(),
  description: z.string().trim().max(600).optional().transform((v) => v || null),
  reelUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value, ctx) => {
      if (!value) return null;
      try {
        const url = new URL(value);
        if (!["instagram.com", "www.instagram.com"].includes(url.hostname)) {
          ctx.addIssue({
            code: "custom",
            message: "Use the original Instagram link.",
          });
          return z.NEVER;
        }
        return url.toString();
      } catch {
        ctx.addIssue({ code: "custom", message: "Enter a valid URL." });
        return z.NEVER;
      }
    }),
  eventId: z.string().trim().optional().transform((v) => (v ? v : null)),
  takenOn: z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return null;
      // A plain date input; midday avoids any chance of a timezone shift
      // moving the album into the previous day.
      const parsed = parseLondonDateTime(`${value}T12:00`);
      if (!parsed) {
        ctx.addIssue({ code: "custom", message: "That is not a valid date." });
        return z.NEVER;
      }
      return parsed;
    }),
  coverUrl: z.string().trim().max(500).optional().transform((v) => v || null),
  coverAlt: z.string().trim().max(300).optional().transform((v) => v || null),
  motif: z.enum(MOTIF_VALUES),
  published: z.boolean(),
})
  // The same rule the event posters follow: an image nobody has described is
  // unreachable for anyone using a screen reader.
  .refine((data) => data.coverUrl === null || data.coverAlt !== null, {
    message: "Describe the cover so it is not lost to screen readers.",
    path: ["coverAlt"],
  });

export async function saveAlbum(
  _previous: AlbumFormState,
  formData: FormData,
): Promise<AlbumFormState> {
  await requireAdmin();

  const parsed = albumSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug") ?? undefined,
    description: formData.get("description") ?? undefined,
    reelUrl: formData.get("reelUrl") ?? undefined,
    eventId: formData.get("eventId") ?? undefined,
    takenOn: formData.get("takenOn") ?? undefined,
    coverUrl: formData.get("coverUrl") ?? undefined,
    coverAlt: formData.get("coverAlt") ?? undefined,
    motif: formData.get("motif"),
    published: formData.get("published") === "on",
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

  const values = {
    ...data,
    slug: data.slug ? slugify(data.slug, "album") : slugify(data.title, "album"),
    // Clearing the cover clears its description with it, so no album keeps a
    // line of alt text describing an image it no longer has.
    coverAlt: data.coverUrl ? data.coverAlt : null,
  };

  let albumId = id;

  try {
    if (id) {
      await getDb().update(albums).set(values).where(eq(albums.id, id));
    } else {
      const [created] = await getDb()
        .insert(albums)
        .values(values)
        .returning({ id: albums.id });
      albumId = created?.id ?? "";
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        status: "error",
        message: "Another album already uses that web address.",
        fieldErrors: { slug: "Already taken - try a different one." },
      };
    }
    return { status: "error", message: reportUnexpected("Save album failed", error) };
  }

  // Straight into the album so photographs can be added next.
  redirect(albumId ? `/admin/gallery/${albumId}` : "/admin/gallery");
}

export async function toggleAlbumPublished(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getDb()
    .update(albums)
    .set({ published: sql`not ${albums.published}` })
    .where(eq(albums.id, id));

  redirect("/admin/gallery");
}

/** Deletes an album; its photographs cascade with it. */
export async function deleteAlbum(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await getDb().delete(albums).where(eq(albums.id, id));

  redirect("/admin/gallery");
}
