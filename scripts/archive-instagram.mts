/**
 * Saves the pictures off the society's Instagram before the links rot.
 *
 * The Apify scrape records each photo as a signed `fna.fbcdn.net` URL. Those
 * URLs are short-lived - days, not months - so the scrape is only a usable
 * archive for as long as it takes someone to run this. After that the JSON
 * still has every caption, but the pictures are gone and the only way back is
 * to scrape again.
 *
 *   npm run instagram:archive [path/to/dataset.json]
 *
 * Writes one file per photo (and per video, where the scrape caught the mp4)
 * into scripts/data/instagram/, plus a manifest.json that pairs every file with
 * the post it came from. The binaries are git-ignored; the manifest is not, so
 * the repository keeps a record of what was taken even on a machine that has
 * not run this.
 *
 * Safe to re-run: a file that is already on disk is left alone, so a run that
 * died halfway can simply be repeated. Nothing here touches the database - see
 * scripts/data/instagram/README.md for what happens next.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** Default location of the scrape, as it was delivered. */
const DEFAULT_DATASET =
  "dataset_instagram-scraper_2026-10-01_08-19-45-153.json";

const OUT_DIR = join("scripts", "data", "instagram");
const MANIFEST = join(OUT_DIR, "manifest.json");

/** Courtesy pause between requests. The CDN is not ours to hammer. */
const DELAY_MS = 250;

/** A post or one slide of a carousel, as the scraper records it. */
type ScrapedNode = {
  id?: string;
  shortCode?: string;
  type?: string;
  caption?: string;
  hashtags?: string[];
  mentions?: string[];
  url?: string;
  displayUrl?: string;
  videoUrl?: string;
  alt?: string | null;
  likesCount?: number;
  timestamp?: string;
  locationName?: string | null;
  ownerUsername?: string;
  ownerFullName?: string;
  originalWidth?: number;
  originalHeight?: number;
  dimensionsWidth?: number;
  dimensionsHeight?: number;
  childPosts?: ScrapedNode[];
};

type ManifestFile = {
  /** Filename within scripts/data/instagram/. */
  file: string;
  kind: "image" | "video";
  /** Position in the carousel, 1-based. 1 for a single-photo post. */
  slide: number;
  width?: number;
  height?: number;
  bytes: number;
  /** Of the bytes on disk, so a later upload can spot a truncated download. */
  sha256: string;
};

type ManifestPost = {
  shortCode: string;
  url?: string;
  owner?: string;
  ownerFullName?: string;
  timestamp?: string;
  type?: string;
  caption?: string;
  hashtags?: string[];
  mentions?: string[];
  locationName?: string | null;
  likesCount?: number;
  files: ManifestFile[];
};

/**
 * Deliberately not recorded: the `displayUrl` each file came from. It is a
 * signed URL that stops working within days, so keeping it would only invite
 * someone to trust a link that cannot resolve. `url` - the permalink - is the
 * provenance that lasts.
 */

const datasetPath = process.argv[2] ?? DEFAULT_DATASET;

let posts: ScrapedNode[];
try {
  posts = JSON.parse(await readFile(datasetPath, "utf8")) as ScrapedNode[];
} catch (error) {
  console.error(
    `Could not read the scrape at ${datasetPath}: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  console.error("Pass the path as an argument if it lives somewhere else.");
  process.exit(1);
}

if (!Array.isArray(posts)) {
  console.error(`${datasetPath} is not an array of posts.`);
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });

/** Every file already here, so a second run costs no requests. */
const onDisk = new Map<string, number>();
for (const name of await readdir(OUT_DIR)) {
  const info = await stat(join(OUT_DIR, name));
  if (info.isFile() && info.size > 0) onDisk.set(name, info.size);
}

/**
 * The stem a post's files share: date first so the directory sorts
 * chronologically, then the shortcode, which is what identifies the post to
 * Instagram and keeps two posts from the same day apart.
 */
function stemFor(post: ScrapedNode, index: number): string {
  const date = (post.timestamp ?? "unknown").slice(0, 10);
  const code = post.shortCode ?? post.id ?? "unknown";
  return `${date}-${code}-${String(index).padStart(2, "0")}`;
}

let downloaded = 0;
let skipped = 0;
const failures: string[] = [];

async function fetchTo(url: string, name: string): Promise<number | null> {
  const existing = onDisk.get(name);
  if (existing !== undefined) {
    skipped += 1;
    return existing;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // 403 here almost always means the signed URL has expired rather than
      // that anything is wrong with this script.
      failures.push(
        `${name} - HTTP ${response.status}${
          response.status === 403 ? " (link expired; the scrape needs redoing)" : ""
        }`,
      );
      return null;
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength === 0) {
      failures.push(`${name} - empty response`);
      return null;
    }

    await writeFile(join(OUT_DIR, name), bytes);
    onDisk.set(name, bytes.byteLength);
    downloaded += 1;
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    return bytes.byteLength;
  } catch (error) {
    failures.push(
      `${name} - ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

async function digest(name: string): Promise<string> {
  const bytes = await readFile(join(OUT_DIR, name));
  return createHash("sha256").update(bytes).digest("hex");
}

/** A post's slides: a carousel's children, or the post itself when it is one photo. */
function slidesOf(post: ScrapedNode): ScrapedNode[] {
  return post.childPosts && post.childPosts.length > 0
    ? post.childPosts
    : [post];
}

const manifest: ManifestPost[] = [];

console.log(`\nArchiving ${posts.length} post(s) from ${datasetPath}…\n`);

for (const post of posts) {
  const slides = slidesOf(post);
  const files: ManifestFile[] = [];

  for (const [position, slide] of slides.entries()) {
    const stem = stemFor(post, position + 1);

    if (slide.displayUrl) {
      const name = `${stem}.jpg`;
      const bytes = await fetchTo(slide.displayUrl, name);
      if (bytes !== null) {
        files.push({
          file: name,
          kind: "image",
          slide: position + 1,
          width: slide.originalWidth ?? slide.dimensionsWidth,
          height: slide.originalHeight ?? slide.dimensionsHeight,
          bytes,
          sha256: await digest(name),
        });
      }
    }

    // Reels and video slides: the cover above is what the gallery would show,
    // but the mp4 is the thing that cannot be recovered later, so take both.
    if (slide.videoUrl) {
      const name = `${stem}.mp4`;
      const bytes = await fetchTo(slide.videoUrl, name);
      if (bytes !== null) {
        files.push({
          file: name,
          kind: "video",
          slide: position + 1,
          width: slide.originalWidth ?? slide.dimensionsWidth,
          height: slide.originalHeight ?? slide.dimensionsHeight,
          bytes,
          sha256: await digest(name),
        });
      }
    }
  }

  if (files.length === 0) continue;

  manifest.push({
    shortCode: post.shortCode ?? post.id ?? "unknown",
    url: post.url,
    owner: post.ownerUsername,
    ownerFullName: post.ownerFullName,
    timestamp: post.timestamp,
    type: post.type,
    caption: post.caption,
    hashtags: post.hashtags?.length ? post.hashtags : undefined,
    mentions: post.mentions?.length ? post.mentions : undefined,
    locationName: post.locationName ?? undefined,
    likesCount: post.likesCount,
    files,
  });

  console.log(
    `  ${post.timestamp?.slice(0, 10) ?? "??????????"}  ${String(
      files.length,
    ).padStart(2)} file(s)  @${post.ownerUsername ?? "?"}`,
  );
}

manifest.sort((a, b) => (a.timestamp ?? "").localeCompare(b.timestamp ?? ""));

await writeFile(
  MANIFEST,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      dataset: datasetPath,
      note: "Written by npm run instagram:archive. Files live beside this manifest and are git-ignored.",
      posts: manifest,
    },
    null,
    2,
  )}\n`,
);

const totalBytes = manifest
  .flatMap((post) => post.files)
  .reduce((sum, file) => sum + file.bytes, 0);

console.log(
  `\n${downloaded} downloaded, ${skipped} already present - ${
    manifest.flatMap((post) => post.files).length
  } file(s) across ${manifest.length} post(s), ${(
    totalBytes /
    1024 /
    1024
  ).toFixed(1)}MB.`,
);
console.log(`Manifest: ${MANIFEST}`);

if (failures.length > 0) {
  console.log(`\n${failures.length} failed:`);
  for (const line of failures) console.log(`  · ${line}`);
  console.log(
    "\nIf these are 403s the scrape has aged out - re-run the scraper and try again.\n",
  );
  process.exit(1);
}

console.log("");
