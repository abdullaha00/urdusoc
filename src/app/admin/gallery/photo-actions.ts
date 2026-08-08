"use server";

import { del } from "@vercel/blob";
import { and, asc, desc, eq, gt, lt, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { photos } from "@/lib/db/schema";
import { reportUnexpected } from "@/lib/errors";
import { env } from "@/lib/env";

export type AddPhotoResult = { ok: boolean; message?: string };

const addPhotoSchema = z.object({
  albumId: z.string().trim().min(1),
  // Zod v4 style, matching the `z.email()` usage in the public forms.
  url: z.string().trim().pipe(z.url()),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  // Not optional, and not merely non-empty: a blank alt attribute is worse than
  // a missing photograph for anyone using a screen reader.
  alt: z
    .string()
    .trim()
    .min(1, "Please describe the photograph.")
    .max(300),
  caption: z.string().trim().max(300).optional(),
});

/**
 * Records a photograph the browser has already uploaded to Blob storage.
 *
 * Called directly from the uploader once `upload()` resolves, rather than from
 * Blob's `onUploadCompleted` webhook — that never reaches localhost, so relying
 * on it would mean photographs silently never appear in local development.
 */
export async function addPhoto(input: {
  albumId: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
}): Promise<AddPhotoResult> {
  await requireAdmin();

  const parsed = addPhotoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "That photograph was rejected.",
    };
  }

  const { albumId, url, width, height, alt, caption } = parsed.data;

  try {
    const db = getDb();

    // Append to the end of the album.
    const [last] = await db
      .select({ value: sql<number>`coalesce(max(${photos.orderIndex}), -1)::int` })
      .from(photos)
      .where(eq(photos.albumId, albumId));

    await db.insert(photos).values({
      albumId,
      url,
      width,
      height,
      alt,
      caption: caption || null,
      orderIndex: (last?.value ?? -1) + 1,
    });
  } catch (error) {
    return { ok: false, message: reportUnexpected("Add photo failed", error) };
  }

  revalidatePath(`/admin/gallery/${albumId}`);
  return { ok: true };
}

const detailsSchema = z.object({
  alt: z.string().trim().min(1, "Please describe the photograph.").max(300),
  caption: z.string().trim().max(300).optional(),
});

export async function updatePhoto(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const albumId = String(formData.get("albumId") ?? "");
  if (!id || !albumId) return;

  const parsed = detailsSchema.safeParse({
    alt: formData.get("alt"),
    caption: formData.get("caption") ?? undefined,
  });

  // A blank alt is simply not saved; the field is `required` in the markup too.
  if (parsed.success) {
    await getDb()
      .update(photos)
      .set({ alt: parsed.data.alt, caption: parsed.data.caption || null })
      .where(eq(photos.id, id));
  }

  redirect(`/admin/gallery/${albumId}`);
}

/** Swaps a photograph with its neighbour, so albums can be ordered by hand. */
export async function movePhoto(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const albumId = String(formData.get("albumId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id || !albumId || (direction !== "up" && direction !== "down")) return;

  await getDb().transaction(async (tx) => {
    const [row] = await tx.select().from(photos).where(eq(photos.id, id)).limit(1);
    if (!row) return;

    const [neighbour] = await tx
      .select()
      .from(photos)
      .where(
        and(
          eq(photos.albumId, row.albumId),
          ne(photos.id, row.id),
          direction === "up"
            ? lt(photos.orderIndex, row.orderIndex)
            : gt(photos.orderIndex, row.orderIndex),
        ),
      )
      .orderBy(direction === "up" ? desc(photos.orderIndex) : asc(photos.orderIndex))
      .limit(1);

    if (!neighbour) return;

    await tx
      .update(photos)
      .set({ orderIndex: neighbour.orderIndex })
      .where(eq(photos.id, row.id));
    await tx
      .update(photos)
      .set({ orderIndex: row.orderIndex })
      .where(eq(photos.id, neighbour.id));
  });

  redirect(`/admin/gallery/${albumId}`);
}

/**
 * Removes a photograph, and the underlying blob with it.
 *
 * The row is deleted first: an orphaned blob costs a little storage, whereas a
 * row pointing at a deleted blob renders a broken image on the public gallery.
 */
export async function deletePhoto(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const albumId = String(formData.get("albumId") ?? "");
  if (!id || !albumId) return;

  const [row] = await getDb()
    .select({ url: photos.url })
    .from(photos)
    .where(eq(photos.id, id))
    .limit(1);

  await getDb().delete(photos).where(eq(photos.id, id));

  if (row?.url && env.blobToken) {
    try {
      await del(row.url);
    } catch (error) {
      // The row is already gone, which is what the committee asked for. A
      // leftover blob is not worth failing the request over.
      console.error("Blob delete failed", error);
    }
  }

  redirect(`/admin/gallery/${albumId}`);
}
