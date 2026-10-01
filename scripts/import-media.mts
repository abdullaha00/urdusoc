/**
 * Imports curated gallery albums and current committee portraits after
 * `npm run media:upload` has written media-uploads.json.
 *
 * Gallery videos stay on Instagram; each reel album gets the cover still
 * Instagram already publishes, as its thumbnail. That cover is an album-level
 * field rather than a photo row, because it is the reel's own frame and not a
 * photograph of the evening - a photograph the committee uploads later shows in
 * front of it without anything having to be deleted.
 *
 * If an older media manifest contains the frame stills briefly used for these
 * albums, only those exact photo rows are removed; any photographs added later
 * by the committee are left alone.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { and, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";
import {
  committeePortraits,
  coverPathname,
  galleryAlbums,
} from "./data/curated-media";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const uploadsPath = join(
  "scripts",
  "data",
  "instagram",
  "media-uploads.json",
);
const parsed = JSON.parse(await readFile(uploadsPath, "utf8")) as {
  uploads: { pathname: string; url: string }[];
};
const urls = new Map(parsed.uploads.map((record) => [record.pathname, record.url]));

// These deterministic paths were briefly used for extracted video frames.
// Match the path suffix rather than a particular Blob hostname so cleanup also
// works after the upload manifest has been rewritten to contain portraits only.
const retiredFramePathnames = galleryAlbums.flatMap((album) =>
  [1, 2, 3, 4].map(
    (order) =>
      `gallery/${album.slug}/${String(order).padStart(2, "0")}.jpg`,
  ),
);

const wantedPaths = [
  ...committeePortraits.map((portrait) => portrait.asset.pathname),
  ...galleryAlbums.map((album) => coverPathname(album.slug)),
];
const missing = wantedPaths.filter((pathname) => !urls.get(pathname));
if (missing.length > 0) {
  throw new Error(
    `media-uploads.json is missing ${missing.length} file(s):\n${missing.join("\n")}`,
  );
}

const client = postgres(url, { prepare: false, max: 1 });
const db = drizzle(client, { schema });

let portraitsUpdated = 0;
let albumsLinked = 0;
let frameRowsRemoved = 0;
let placeholdersUnpublished = 0;

console.log("\nImporting curated media…\n");

await db.transaction(async (tx) => {
  for (const portrait of committeePortraits) {
    const [updated] = await tx
      .update(schema.committee)
      .set({ photoUrl: urls.get(portrait.asset.pathname) })
      .where(
        and(
          eq(schema.committee.academicYear, portrait.academicYear),
          eq(schema.committee.name, portrait.name),
          eq(schema.committee.isCurrent, true),
        ),
      )
      .returning({ id: schema.committee.id });

    if (!updated) {
      throw new Error(
        `${portrait.name} (${portrait.academicYear}) is not in the current committee. Run db:import-committee first.`,
      );
    }
    portraitsUpdated += 1;
    console.log(`  portrait ${portrait.name}`);
  }

  for (const album of galleryAlbums) {
    const [event] = await tx
      .select({ id: schema.events.id })
      .from(schema.events)
      .where(eq(schema.events.slug, album.eventSlug))
      .limit(1);
    if (!event) {
      throw new Error(
        `Event ${album.eventSlug} is missing. Run db:import-events first.`,
      );
    }

    const values = {
      title: album.title,
      description: album.description,
      reelUrl: album.reelUrl,
      eventId: event.id,
      takenOn: new Date(`${album.takenOn}T12:00:00Z`),
      coverUrl: urls.get(coverPathname(album.slug)) ?? null,
      coverAlt: album.cover.alt,
      motif: album.motif,
      published: true,
    };

    const [row] = await tx
      .insert(schema.albums)
      .values({ slug: album.slug, ...values })
      .onConflictDoUpdate({ target: schema.albums.slug, set: values })
      .returning({ id: schema.albums.id });

    const removed = await tx
      .delete(schema.photos)
      .where(
        and(
          eq(schema.photos.albumId, row.id),
          or(
            ...retiredFramePathnames.map((pathname) =>
              like(schema.photos.url, `%/${pathname}`),
            ),
          ),
        ),
      )
      .returning({ id: schema.photos.id });
    frameRowsRemoved += removed.length;

    albumsLinked += 1;
    console.log(`  reel     ${album.title}`);
  }

  for (const slug of [
    "mushaira",
    "chai-social",
    "urdu-calligraphy-workshop",
  ]) {
    const [album] = await tx
      .select({ id: schema.albums.id })
      .from(schema.albums)
      .where(eq(schema.albums.slug, slug))
      .limit(1);
    if (!album) continue;

    const existingPhotos = await tx
      .select({ id: schema.photos.id })
      .from(schema.photos)
      .where(eq(schema.photos.albumId, album.id))
      .limit(1);
    if (existingPhotos.length > 0) continue;

    const rows = await tx
      .update(schema.albums)
      .set({ published: false })
      .where(
        and(
          eq(schema.albums.id, album.id),
          eq(schema.albums.published, true),
        ),
      )
      .returning({ id: schema.albums.id });
    placeholdersUnpublished += rows.length;
  }
});

await client.end();

console.log(
  `\n${portraitsUpdated} portrait(s) linked and ${albumsLinked} gallery reel(s) linked.`,
);
console.log(`${frameRowsRemoved} imported frame still(s) removed from the gallery.`);
console.log(
  `${placeholdersUnpublished} empty seed album(s) unpublished; none were deleted.\n`,
);
