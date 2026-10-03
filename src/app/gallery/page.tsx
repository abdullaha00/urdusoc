import type { Metadata } from "next";
import Image from "next/image";
import { AlbumTile } from "@/components/past-moments";
import { PageHeader, SectionLabel } from "@/components/ui";
import { formatEventDateWithYear, toDateAttribute } from "@/lib/format";
import {
  getAlbumCovers,
  getEventPosters,
  getPublishedAlbums,
  type EventPoster,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photographs, reels and poster art from mushairas, chai socials and workshops run by the Cambridge University Urdu Society.",
};

export default async function GalleryPage() {
  const albums = await getPublishedAlbums();
  const covers = await getAlbumCovers(albums.map((album) => album.id));
  const posters = await getEventPosters();

  return (
    <>
      <PageHeader
        title="Evenings we have spent together."
        titleUrdu="یادیں"
        intro="Poetry read aloud, chai poured badly, calligraphy attempted with more enthusiasm than skill."
      />

      <section className="border-b border-rule/70">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <SectionLabel as="h2" trailingRule className="text-ink-muted">
            Albums
          </SectionLabel>

          {albums.length > 0 ? (
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
            <p className="mt-10 max-w-md leading-relaxed text-ink-muted">
              No albums yet. Photographs from this term will appear here once the
              committee has uploaded them.
            </p>
          )}
        </div>
      </section>

      <VisualArchive posters={posters} />
    </>
  );
}

/**
 * The poster art, kept in its own section rather than mixed into the albums
 * above.
 *
 * A poster is an announcement printed before the evening; an album is what the
 * evening left behind. Shown together they would make it impossible to tell
 * which evenings anyone actually photographed, so the two sit apart and the
 * section says plainly which this is.
 *
 * The tiles are 4:5 and uncropped-looking for the same reason the event cards
 * are: the posters are made for Instagram, and the date, time and room are
 * usually printed along the bottom edge.
 */
function VisualArchive({ posters }: { posters: EventPoster[] }) {
  if (posters.length === 0) return null;

  return (
    <section className="bg-paper-deep">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
        <SectionLabel as="h2" trailingRule className="text-ink-muted">
          Visual archive
        </SectionLabel>


        <ul className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {posters.map((poster) => (
            <li key={poster.id}>
              <PosterTile poster={poster} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PosterTile({ poster }: { poster: EventPoster }) {
  const art = (
    <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-rule bg-paper shadow-paper">
      <Image
        src={poster.posterUrl}
        // Falls back to the title rather than an empty string: the poster is
        // the only place some evenings state their guest or their venue.
        alt={poster.posterAlt ?? poster.title}
        fill
        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 280px"
        // Contained, not cropped: the event rows can crop their thumbnails
        // because the row prints the date beside them, but here the poster is
        // the content. The square ones sit with a band above and below rather
        // than losing the edges the committee set their type against.
        className="object-contain"
      />
    </div>
  );

  return (
    <figure className="group flex flex-col">
      {/* Only the posts we published ourselves are linked; an evening with no
          post of its own is a picture to look at, not a dead end to click. */}
      {poster.instagramUrl ? (
        <a
          href={poster.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="block transition-opacity duration-200 group-hover:opacity-90"
          aria-label={`${poster.title} on Instagram`}
        >
          {art}
        </a>
      ) : (
        art
      )}

      <figcaption className="mt-3">
        <span className="block font-serif text-sm leading-snug tracking-tight text-balance">
          {poster.title}
        </span>
        {poster.startsAt ? (
          <time
            dateTime={toDateAttribute(poster.startsAt)}
            className="mt-0.5 block text-xs text-ink-muted"
          >
            {formatEventDateWithYear(poster.startsAt)}
          </time>
        ) : (
          <span className="mt-0.5 block text-xs text-ink-muted">TBC</span>
        )}
      </figcaption>
    </figure>
  );
}
