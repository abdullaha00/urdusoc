import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { AlbumForm } from "@/components/admin/album-form";
import { DangerConfirm } from "@/components/admin/danger-confirm";
import { PhotoUploader } from "@/components/admin/photo-uploader";
import { Field, Input, SubmitButton } from "@/components/form";
import {
  getAdminAlbumById,
  getAlbumPhotos,
  getEventOptions,
} from "@/lib/admin/queries";
import { env } from "@/lib/env";
import { deleteAlbum } from "../actions";
import { deletePhoto, movePhoto, updatePhoto } from "../photo-actions";

export const metadata = { title: "Album" };

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const album = await getAdminAlbumById(id);

  if (!album) notFound();

  const [photos, events] = await Promise.all([
    getAlbumPhotos(id),
    getEventOptions(),
  ]);

  const blobConfigured = Boolean(env.blobToken);

  return (
    <>
      <AdminPageHeader
        title={album.title}
        description={
          album.published
            ? "Live in the public gallery."
            : "Draft — not in the public gallery yet."
        }
        backHref="/admin/gallery"
        backLabel="Gallery"
        action={
          album.published ? (
            <Link
              href={`/gallery/${album.slug}`}
              className="text-xs font-medium text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
            >
              View on site →
            </Link>
          ) : null
        }
      />

      <section className="mb-12">
        <h2 className="mb-4 text-[0.65rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
          Photographs
        </h2>

        {blobConfigured ? (
          <div className="mb-6 max-w-2xl">
            <PhotoUploader albumId={album.id} />
          </div>
        ) : (
          <div className="mb-6 max-w-2xl rounded-sm border border-gold/30 bg-gold/5 px-4 py-3 text-sm leading-relaxed text-gold-deep">
            Photograph uploads need a Vercel Blob store. Create one and set{" "}
            <code className="font-mono text-xs">BLOB_READ_WRITE_TOKEN</code>, then
            this becomes an upload box. Until then the album shows its motif.
          </div>
        )}

        {photos.length === 0 ? (
          <EmptyState>
            No photographs yet — the album shows its “{album.motif}” motif on the
            public site.
          </EmptyState>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2">
            {photos.map((photo) => (
              <li
                key={photo.id}
                className="flex flex-col gap-3 rounded-sm border border-rule bg-paper p-4"
              >
                <div className="relative aspect-4/3 overflow-hidden rounded-xs bg-paper-deep">
                  <Image
                    src={photo.url}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 640px) 20rem, 100vw"
                    className="object-cover"
                  />
                </div>

                <form action={updatePhoto} className="flex flex-col gap-3">
                  <input type="hidden" name="id" value={photo.id} />
                  <input type="hidden" name="albumId" value={album.id} />

                  <Field label="Alt text" htmlFor={`alt-${photo.id}`} required>
                    <Input
                      id={`alt-${photo.id}`}
                      name="alt"
                      defaultValue={photo.alt}
                      required
                    />
                  </Field>

                  <Field label="Caption" htmlFor={`caption-${photo.id}`}>
                    <Input
                      id={`caption-${photo.id}`}
                      name="caption"
                      defaultValue={photo.caption ?? ""}
                    />
                  </Field>

                  <div>
                    <SubmitButton
                      variant="outline"
                      pendingLabel="Saving…"
                      className="px-4 py-2 text-xs"
                    >
                      Save
                    </SubmitButton>
                  </div>
                </form>

                <div className="flex items-center justify-between border-t border-rule/60 pt-3">
                  <div className="flex items-center gap-1">
                    <form action={movePhoto} className="inline">
                      <input type="hidden" name="id" value={photo.id} />
                      <input type="hidden" name="albumId" value={album.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        type="submit"
                        aria-label="Move photograph earlier"
                        className="px-1 text-ink-muted transition-colors hover:text-forest"
                      >
                        ↑
                      </button>
                    </form>
                    <form action={movePhoto} className="inline">
                      <input type="hidden" name="id" value={photo.id} />
                      <input type="hidden" name="albumId" value={album.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        type="submit"
                        aria-label="Move photograph later"
                        className="px-1 text-ink-muted transition-colors hover:text-forest"
                      >
                        ↓
                      </button>
                    </form>
                  </div>

                  <form action={deletePhoto}>
                    <input type="hidden" name="id" value={photo.id} />
                    <input type="hidden" name="albumId" value={album.id} />
                    <button
                      type="submit"
                      className="text-xs text-ink-muted underline underline-offset-4 transition-colors hover:text-wine"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-rule/70 pt-8">
        <h2 className="mb-6 text-[0.65rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
          Album details
        </h2>
        <AlbumForm album={album} events={events} />
      </section>

      <section className="mt-12 max-w-3xl border-t border-rule/70 pt-8">
        <h2 className="text-[0.65rem] font-medium tracking-[0.22em] text-ink-muted uppercase">
          Delete
        </h2>
        <p className="mt-3 mb-4 text-sm leading-relaxed text-ink-muted">
          Deletes the album and its {photos.length}{" "}
          {photos.length === 1 ? "photograph" : "photographs"}. Unpublishing is
          reversible; this is not.
        </p>
        <form action={deleteAlbum}>
          <input type="hidden" name="id" value={album.id} />
          <DangerConfirm
            phrase={album.slug}
            openLabel="Delete this album…"
            confirmLabel="Delete album"
            description="This cannot be undone."
          />
        </form>
      </section>
    </>
  );
}
