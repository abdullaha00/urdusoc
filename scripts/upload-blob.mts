/**
 * Puts the archived Instagram posters into Blob storage.
 *
 *   npm run blob:upload            # upload anything not yet uploaded
 *   npm run blob:upload -- --force # re-upload everything
 *
 * Only the files named by `poster.file` in scripts/data/past-events.ts are
 * uploaded. The rest of the archive stays on disk: committee portraits are
 * students' faces and not this script's decision to publish, and partner
 * societies' artwork is not ours to host at all.
 *
 * The result is written to scripts/data/instagram/uploads.json, which is
 * committed. `npm run db:import-events` reads it to fill in `poster_url`, so a
 * database import needs no network and no Blob token.
 *
 * Idempotent twice over: a file already in uploads.json is skipped, and the
 * Blob pathname is derived from the filename rather than randomised, so a
 * forced re-upload overwrites in place and every URL already on the site keeps
 * working.
 *
 * Authentication can use the project-scoped OIDC credentials written by
 * `vercel link` / `vercel env pull` (VERCEL_OIDC_TOKEN + BLOB_STORE_ID), or a
 * legacy BLOB_READ_WRITE_TOKEN. Uploading publishes these images at a public
 * URL - which is what a poster on an events page is - so run it knowingly.
 */

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { put } from "@vercel/blob";
import { pastEvents } from "./data/past-events";

const ARCHIVE_DIR = join("scripts", "data", "instagram");
const UPLOADS = join(ARCHIVE_DIR, "uploads.json");

/** Everything lands under one prefix, so the store stays legible in the dashboard. */
const PREFIX = "posters";

type UploadRecord = {
  /** Filename within scripts/data/instagram/. */
  file: string;
  url: string;
  pathname: string;
  bytes: number;
  /** Of the local file, so a changed source is noticed on the next run. */
  sha256: string;
  uploadedAt: string;
};

type UploadsFile = {
  note: string;
  uploads: UploadRecord[];
};

const force = process.argv.includes("--force");

const hasOidcCredentials = Boolean(
  process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID,
);
const hasReadWriteToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

if (!hasOidcCredentials && !hasReadWriteToken) {
  console.error(
    "Blob credentials are not set. Link the project and pull VERCEL_OIDC_TOKEN + BLOB_STORE_ID, or set BLOB_READ_WRITE_TOKEN.",
  );
  process.exit(1);
}

/** What has already been uploaded, keyed by filename. */
const existing = new Map<string, UploadRecord>();
try {
  const parsed = JSON.parse(await readFile(UPLOADS, "utf8")) as UploadsFile;
  for (const record of parsed.uploads) existing.set(record.file, record);
} catch {
  // No uploads.json yet - the first run writes it.
}

const wanted = pastEvents
  .map((event) => event.poster?.file)
  .filter((file): file is string => Boolean(file));

const unique = [...new Set(wanted)];
if (unique.length !== wanted.length) {
  console.log(
    `Note: ${wanted.length - unique.length} poster file(s) are shared by more than one event.\n`,
  );
}

console.log(
  `\n${unique.length} poster(s) referenced by scripts/data/past-events.ts…\n`,
);

let uploaded = 0;
let skipped = 0;
const failures: string[] = [];
const records: UploadRecord[] = [];

for (const file of unique) {
  const already = existing.get(file);
  let bytes: Buffer;
  try {
    bytes = await readFile(join(ARCHIVE_DIR, file));
  } catch {
    if (already) records.push(already);
    failures.push(
      `${file} - not on disk. Run \`npm run instagram:archive\` first.`,
    );
    continue;
  }

  const sha256 = createHash("sha256").update(bytes).digest("hex");

  if (already && already.sha256 === sha256 && !force) {
    records.push(already);
    skipped += 1;
    console.log(`  present  ${file}`);
    continue;
  }

  try {
    const result = await put(`${PREFIX}/${file}`, bytes, {
      access: "public",
      contentType: "image/jpeg",
      // Deterministic pathname: re-running must overwrite the same object
      // rather than scatter copies, because the URL is already in the database.
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    records.push({
      file,
      url: result.url,
      pathname: result.pathname,
      bytes: bytes.byteLength,
      sha256,
      uploadedAt: new Date().toISOString(),
    });
    uploaded += 1;
    console.log(`  uploaded ${file}`);
  } catch (error) {
    // A temporary upload failure must not erase a previously working URL from
    // the manifest. Keep the old record and exit non-zero so it can be retried.
    if (already) records.push(already);
    failures.push(
      `${file} - ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

records.sort((a, b) => a.file.localeCompare(b.file));

await writeFile(
  UPLOADS,
  `${JSON.stringify(
    {
      note: "Written by npm run blob:upload. Read by npm run db:import-events to fill in poster_url.",
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
  for (const line of failures) console.log(`  · ${line}`);
  console.log("");
  process.exit(1);
}

console.log("");
