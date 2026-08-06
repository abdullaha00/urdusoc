import type { Metadata } from "next";
import { AlbumTile } from "@/components/past-moments";
import { PageHeader } from "@/components/ui";
import { getAlbumCovers, getPublishedAlbums } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photographs from mushairas, chai socials and workshops run by the Cambridge University Urdu Society.",
};

export default async function GalleryPage() {
  const albums = await getPublishedAlbums();
  const covers = await getAlbumCovers(albums.map((album) => album.id));

  return (
    <>
      <PageHeader
        label="Gallery"
        title="Evenings we have spent together."
        intro="Poetry read aloud, chai poured badly, calligraphy attempted with more enthusiasm than skill."
      />

      <section>
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          {albums.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((album) => (
                <AlbumTile
                  key={album.id}
                  album={album}
                  cover={covers.get(album.id)}
                  minHeight="min-h-56"
                />
              ))}
            </div>
          ) : (
            <p className="max-w-md leading-relaxed text-ink-muted">
              No albums yet. Photographs from this term will appear here once the
              committee has uploaded them.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
