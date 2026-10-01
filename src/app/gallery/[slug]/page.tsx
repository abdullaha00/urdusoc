import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Motif } from "@/components/past-moments";
import { ArrowLink, PageHeader } from "@/components/ui";
import { getAlbumBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);

  if (!album) return { title: "Album not found" };

  return {
    title: album.title,
    description: album.description ?? undefined,
  };
}

export default async function AlbumPage({ params }: PageProps) {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);

  if (!album) notFound();

  return (
    <>
      <PageHeader
        title={album.title}
        intro={album.description ?? undefined}
      >
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <ArrowLink href="/gallery" className="text-ink-muted hover:text-forest">
            All albums
          </ArrowLink>
          {album.reelUrl ? (
            <ArrowLink href={album.reelUrl} className="text-forest">
              Watch the reel on Instagram
            </ArrowLink>
          ) : null}
        </div>
      </PageHeader>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          {album.photos.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {album.photos.map((photo) => (
                <li key={photo.id}>
                  <figure>
                    <div className="relative aspect-4/3 overflow-hidden rounded-sm border border-rule">
                      <Image
                        src={photo.url}
                        alt={photo.alt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                        className="object-cover"
                      />
                    </div>
                    {photo.caption ? (
                      <figcaption className="mt-3 text-xs text-ink-muted">
                        {photo.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              {/* The reel's cover still, where there is one: a frame from the
                  evening itself reads better than a drawn placeholder, and it
                  shows what the link above leads to. Portrait, because the
                  reels are. */}
              <div
                className={`relative overflow-hidden rounded-sm border border-rule ${
                  album.coverUrl ? "aspect-9/16 max-w-sm" : "aspect-16/9 max-w-3xl"
                }`}
              >
                {album.coverUrl ? (
                  <Image
                    src={album.coverUrl}
                    alt={album.coverAlt ?? album.title}
                    fill
                    priority
                    sizes="(max-width: 640px) 100vw, 24rem"
                    className="object-cover"
                  />
                ) : (
                  <Motif name={album.motif} />
                )}
              </div>
              <p className="mt-6 max-w-md leading-relaxed text-ink-muted">
                {album.reelUrl
                  ? "This moment is kept as its original Instagram reel. Follow the link above to watch it."
                  : "Photographs from this one have not been uploaded yet. Check back after the next committee meeting."}
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
