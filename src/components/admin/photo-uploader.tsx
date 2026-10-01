"use client";

import { upload, uploadPresigned } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { addPhoto } from "@/app/admin/gallery/photo-actions";
import { Field, FormMessage, Input } from "@/components/form";
import { buttonBase, buttonVariants } from "@/components/ui";

const ACCEPT = "image/jpeg,image/png,image/webp";

/**
 * Reads the real pixel dimensions before uploading.
 *
 * `photos.width` and `photos.height` are both NOT NULL - the public gallery
 * needs them to reserve space and avoid layout shift - and the browser is the
 * only place they are known without decoding the image again on the server.
 */
async function readDimensions(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  try {
    return { width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}

export function PhotoUploader({
  albumId,
  uploadMode,
}: {
  albumId: string;
  uploadMode: "presigned" | "legacy";
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onUpload() {
    const file = fileRef.current?.files?.[0];

    if (!file) {
      setError("Choose a photograph first.");
      return;
    }
    if (!alt.trim()) {
      setError("Please describe the photograph before uploading it.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const { width, height } = await readDimensions(file);

      const pathname = `gallery/${albumId}/${file.name}`;
      const options = {
        access: "public" as const,
        handleUploadUrl: "/api/admin/gallery/upload",
        // Read back in the route handler to check the album exists before a
        // token or presigned URL is minted.
        clientPayload: albumId,
      };
      const blob =
        uploadMode === "presigned"
          ? await uploadPresigned(pathname, file, options)
          : await upload(pathname, file, options);

      const result = await addPhoto({
        albumId,
        url: blob.url,
        width,
        height,
        alt: alt.trim(),
        caption: caption.trim() || undefined,
      });

      if (!result.ok) {
        setError(result.message ?? "That photograph could not be saved.");
        return;
      }

      setAlt("");
      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The upload failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-sm border border-rule bg-paper px-5 py-5">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}

      <Field
        label="Photograph"
        htmlFor="photo-file"
        required
        hint="JPEG, PNG or WebP, up to 12MB."
      >
        <input
          id="photo-file"
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          disabled={busy}
          className="w-full text-sm text-ink-muted file:mr-4 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-xs file:font-medium file:text-paper hover:file:bg-forest-soft"
        />
      </Field>

      <Field
        label="Alt text"
        htmlFor="photo-alt"
        required
        hint="What is in the photograph? Read aloud by screen readers."
      >
        <Input
          id="photo-alt"
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          disabled={busy}
          required
        />
      </Field>

      <Field label="Caption" htmlFor="photo-caption" hint="Optional, shown below the photograph.">
        <Input
          id="photo-caption"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          disabled={busy}
        />
      </Field>

      <div>
        <button
          type="button"
          onClick={onUpload}
          disabled={busy}
          aria-busy={busy}
          className={`${buttonBase} ${buttonVariants.primary} px-5 py-2.5 text-xs`}
        >
          {busy ? "Uploading…" : "Upload photograph"}
        </button>
      </div>
    </div>
  );
}
