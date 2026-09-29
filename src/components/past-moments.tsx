import Image from "next/image";
import Link from "next/link";
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
  return (
    <figure className={`group flex flex-col ${className}`}>
      <Link
        href={`/gallery/${album.slug}`}
        className="flex flex-1 flex-col rounded-sm"
        aria-label={album.title}
      >
        <div
          className={`relative flex-1 overflow-hidden rounded-sm border border-rule ${minHeight}`}
        >
          <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
            {cover ? (
              <Image
                src={cover.url}
                alt={cover.alt}
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
      </Link>
      <figcaption className="mt-4 flex items-baseline gap-3">
        <span
          aria-hidden
          className="size-1.5 shrink-0 translate-y-0.5 rotate-45 bg-gold"
        />
        <span>
          <Link
            href={`/gallery/${album.slug}`}
            className={`block font-serif tracking-tight ${titleClassName} text-forest transition-colors duration-200 group-hover:text-forest-soft`}
          >
            {album.title}
          </Link>
          {album.description ? (
            <span className="mt-0.5 block text-xs text-ink-muted">
              {album.description}
            </span>
          ) : null}
        </span>
      </figcaption>
    </figure>
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
        {/* A single word — khat, "script" — standing in for a photograph. */}
        <span lang="ur" dir="rtl" className="urdu text-7xl text-forest/30">
          خط
        </span>
      </div>
      <div className="absolute right-6 bottom-6 h-1 w-16 -rotate-12 rounded-full bg-gold/80" />
    </div>
  );
}
