import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Motif } from "@/components/past-moments";
import { ArrowLink, PageHeader } from "@/components/ui";
import { formatMonthYear } from "@/lib/format";
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
        label={album.takenOn ? formatMonthYear(album.takenOn) : "Gallery"}
        title={album.title}
        intro={album.description ?? undefined}
      >
        <ArrowLink href="/gallery" className="text-ink-muted hover:text-forest">
          All albums
        </ArrowLink>
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
              <div className="relative aspect-16/9 max-w-3xl overflow-hidden rounded-sm border border-rule">
                <Motif name={album.motif} />
              </div>
              <p className="mt-6 max-w-md leading-relaxed text-ink-muted">
                Photographs from this one have not been uploaded yet. Check back
                after the next committee meeting.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
