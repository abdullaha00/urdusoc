import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Album, Photo } from "@/lib/db/schema";
import { ArrowLink, SectionLabel } from "@/components/ui";

export function PastMoments({
  albums,
  covers,
}: {
  albums: Album[];
  covers: Map<string, Photo>;
}) {
  if (albums.length === 0) return null;

  const [feature, ...rest] = albums;

  return (
    <section id="gallery" className="border-b border-rule/70">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
        <SectionLabel as="h2" trailingRule className="text-ink-muted">
          Past moments
        </SectionLabel>

        <div className="mt-10 grid gap-6 md:h-[34rem] md:grid-cols-3 md:grid-rows-2">
          <AlbumTile
            album={feature}
            cover={covers.get(feature.id)}
            className="md:col-span-2 md:row-span-2"
            minHeight="min-h-64 md:min-h-0"
            titleClassName="text-2xl"
            priority
          />
          {rest.slice(0, 2).map((album) => (
            <AlbumTile
              key={album.id}
              album={album}
              cover={covers.get(album.id)}
              minHeight="min-h-44 md:min-h-0"
            />
          ))}
        </div>

        <div className="mt-10">
          <ArrowLink href="/gallery" className="text-ink-muted hover:text-forest">
            See the whole gallery
          </ArrowLink>
        </div>
      </div>
    </section>
  );
}

export function AlbumTile({
  album,
  cover,
  className = "",
  minHeight,
  titleClassName = "text-lg",
  priority = false,
}: {
  album: Album;
  cover?: Photo;
  className?: string;
  minHeight: string;
  titleClassName?: string;
  priority?: boolean;
}) {
  // A photograph of the evening comes first; the reel's own cover still stands
  // in for the albums that are kept as reels, and the drawn motif only appears
  // for an album that has neither.
  const thumbnail =
    cover ??
    (album.coverUrl
      ? { url: album.coverUrl, alt: album.coverAlt ?? album.title }
      : null);

  // An album with photographs opens its own page, because there is a grid of
  // them to look at. An album kept as a reel goes straight to Instagram: its
  // page would only show this same cover and a link onward, so the tile sends
  // the reader where the evening actually is. `cover` is the album's first
  // photograph, so its presence is what tells the two apart.
  const reel = cover ? null : album.reelUrl;
  const href = reel ?? `/gallery/${album.slug}`;

  return (
    <figure className={`group flex flex-col ${className}`}>
      <AlbumLink
        href={href}
        external={Boolean(reel)}
        className="flex flex-1 flex-col rounded-sm"
        label={reel ? `${album.title} - watch on Instagram` : album.title}
      >
        <div
          className={`relative flex-1 overflow-hidden rounded-sm border border-rule ${minHeight}`}
        >
          <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
            {thumbnail ? (
              <Image
                src={thumbnail.url}
                alt={thumbnail.alt}
                fill
                priority={priority}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
                className="object-cover"
              />
            ) : (
              <Motif name={album.motif} />
            )}
          </div>
        </div>
      </AlbumLink>
      <figcaption className="mt-4 flex items-baseline gap-3">
        <span
          aria-hidden
          className="size-1.5 shrink-0 translate-y-0.5 rotate-45 bg-gold"
        />
        <span>
          <AlbumLink
            href={href}
            external={Boolean(reel)}
            className={`block font-serif tracking-tight ${titleClassName} text-forest transition-colors duration-200 group-hover:text-forest-soft`}
          >
            {album.title}
          </AlbumLink>
          {album.description ? (
            <span className="mt-0.5 block text-xs text-ink-muted">
              {album.description}
            </span>
          ) : null}
          {/* Said once, under the title, and only where it is not already where
              the tile leads: a reel album's picture and title both go to
              Instagram, so a third link to the same post would only be noise.
              An album with photographs still names its reel, because its own
              page is what the tile opens. */}
          {reel ? (
            <span className="mt-2 block text-xs text-ink-muted">
              Kept as a reel on Instagram
            </span>
          ) : album.reelUrl ? (
            <ArrowLink href={album.reelUrl} className="mt-3 text-xs text-forest">
              Watch the reel on Instagram
            </ArrowLink>
          ) : null}
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * The tile's link, which leaves the site for an album kept as a reel.
 *
 * `next/link` is right for an album page and wrong for Instagram, so the two
 * cases are kept apart here rather than at each of the tile's two call sites.
 */
function AlbumLink({
  href,
  external,
  className,
  label,
  children,
}: {
  href: string;
  external: boolean;
  className: string;
  label?: string;
  children: ReactNode;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={className}
        aria-label={label}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} aria-label={label}>
      {children}
    </Link>
  );
}

/**
 * Abstract, dependency-free stand-ins used until an album has real photographs.
 * The name comes from `albums.motif`.
 */
export function Motif({ name }: { name: string | null }) {
  if (name === "mushaira") {
    return (
      <div className="absolute inset-0 bg-forest">
        <div className="absolute -top-20 -right-16 size-72 rounded-full bg-gold/25 blur-3xl" />
        <div className="absolute top-12 right-14 size-24 rounded-full bg-gold/15" />
        <div className="absolute top-12 right-14 size-24 rounded-full border border-gold/50" />
        <div className="absolute top-6 right-8 size-36 rounded-full border border-gold/20" />
        <div className="ruled absolute inset-x-0 bottom-0 h-2/3 opacity-55" />
        <div className="absolute inset-x-10 bottom-12 h-px bg-gold/50" />
        <div className="absolute bottom-8 left-10 flex gap-2">
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="size-1.5 rotate-45 bg-gold/70" />
          ))}
        </div>
      </div>
    );
  }

  if (name === "chai") {
    return (
      <div className="absolute inset-0 bg-paper-deep">
        <div className="absolute inset-0 bg-wine/6" />
        <div className="absolute top-1/2 left-1/2 size-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-wine/25" />
        <div className="absolute top-1/2 left-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-wine/35" />
        <div className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-wine/25" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-paper">
      <div className="ruled absolute inset-0 opacity-40" />
      <div className="absolute inset-0 flex items-center justify-center">
        {/* A single word - khat, "script" - standing in for a photograph. */}
        <span lang="ur" dir="rtl" className="urdu text-7xl text-forest/30">
          خط
        </span>
      </div>
      <div className="absolute right-6 bottom-6 h-1 w-16 -rotate-12 rounded-full bg-gold/80" />
    </div>
  );
}
