/**
 * Uploads the current committee's complete announcement cards and the cover
 * still of each gallery reel.
 *
 *   npm run media:upload
 *   npm run media:upload -- --force
 *
 * Every source is checked against the Instagram archive manifest and must be
 * owned by @cambridgeurdusoc. The original JPEG bytes are preserved so the
 * cards' typography and decorative design remain intact. Gallery videos remain
 * on Instagram - only the cover Instagram itself publishes is copied here.
 */

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { put } from "@vercel/blob";
import { curatedMediaAssets } from "./data/curated-media";

const ARCHIVE_DIR = join("scripts", "data", "instagram");
const ARCHIVE_MANIFEST = join(ARCHIVE_DIR, "manifest.json");
const UPLOADS = join(ARCHIVE_DIR, "media-uploads.json");
const SOCIETY_OWNER = "cambridgeurdusoc";

type UploadRecord = {
  sourceFile: string;
  url: string;
  pathname: string;
  bytes: number;
  width: number;
  height: number;
  sha256: string;
  uploadedAt: string;
};

type UploadsFile = {
  note: string;
  uploads: UploadRecord[];
};

type ArchiveManifest = {
  posts: {
    owner: string;
    files: { file: string; sha256: string }[];
  }[];
};

const force = process.argv.includes("--force");
const hasOidcCredentials = Boolean(
  process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID,
);
const hasReadWriteToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

if (!hasOidcCredentials && !hasReadWriteToken) {
  console.error(
    "Blob credentials are not set. Pull VERCEL_OIDC_TOKEN + BLOB_STORE_ID, or set BLOB_READ_WRITE_TOKEN.",
  );
  process.exit(1);
}

const archive = JSON.parse(
  await readFile(ARCHIVE_MANIFEST, "utf8"),
) as ArchiveManifest;
const archivedFiles = new Map<
  string,
  { owner: string; sha256: string }
>();
for (const post of archive.posts) {
  for (const file of post.files) {
    archivedFiles.set(file.file, { owner: post.owner, sha256: file.sha256 });
  }
}

for (const asset of curatedMediaAssets) {
  const archived = archivedFiles.get(asset.sourceFile);
  if (!archived) {
    throw new Error(`${asset.sourceFile} is not recorded in manifest.json.`);
  }
  if (archived.owner !== SOCIETY_OWNER) {
    throw new Error(
      `${asset.sourceFile} belongs to @${archived.owner}; only society-owned media may be uploaded.`,
    );
  }
}

const existing = new Map<string, UploadRecord>();
try {
  const parsed = JSON.parse(await readFile(UPLOADS, "utf8")) as UploadsFile;
  for (const record of parsed.uploads) existing.set(record.pathname, record);
} catch {
  // The first successful run creates the manifest.
}

console.log(`\nPreparing ${curatedMediaAssets.length} curated image(s)…\n`);

let uploaded = 0;
let skipped = 0;
const failures: string[] = [];
const records: UploadRecord[] = [];

for (const asset of curatedMediaAssets) {
  const already = existing.get(asset.pathname);

  try {
    const source = await readFile(join(ARCHIVE_DIR, asset.sourceFile));
    const sha256 = createHash("sha256").update(source).digest("hex");
    if (sha256 !== archivedFiles.get(asset.sourceFile)?.sha256) {
      throw new Error("local source does not match the archive manifest");
    }

    if (already && already.sha256 === sha256 && !force) {
      records.push(already);
      skipped += 1;
      console.log(`  present  ${asset.pathname}`);
      continue;
    }

    const result = await put(asset.pathname, source, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    records.push({
      sourceFile: asset.sourceFile,
      url: result.url,
      pathname: result.pathname,
      bytes: source.byteLength,
      width: asset.outputWidth,
      height: asset.outputHeight,
      sha256,
      uploadedAt: new Date().toISOString(),
    });
    uploaded += 1;
    console.log(`  uploaded ${asset.pathname}`);
  } catch (error) {
    if (already) records.push(already);
    failures.push(
      `${asset.pathname} - ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

records.sort((a, b) => a.pathname.localeCompare(b.pathname));
await writeFile(
  UPLOADS,
  `${JSON.stringify(
    {
      note: "Written by npm run media:upload. Read by npm run db:import-media and db:import-committee.",
      uploads: records,
    } satisfies UploadsFile,
    null,
    2,
  )}\n`,
);

console.log(`\n${uploaded} uploaded, ${skipped} already present.`);
console.log(`Manifest: ${UPLOADS}`);

if (failures.length > 0) {
  console.log(`\n${failures.length} failed:`);
  for (const failure of failures) console.log(`  · ${failure}`);
  console.log("");
  process.exit(1);
}

console.log("");
