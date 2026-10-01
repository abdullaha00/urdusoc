# The Instagram archive

173 files - 164 photos and 9 videos - pulled off `@cambridgeurdusoc` and the
partner societies' accounts on 1 October 2026, covering February 2022 to
September 2026. Written by `npm run instagram:archive` from an Apify scrape.

The files themselves are git-ignored (188MB, mostly reels). `manifest.json` is
not: it pairs every filename with the post it came from - permalink, date,
account, caption, hashtags, location - so the record of what was taken survives
on a machine that has never run the script.

## Why this exists

The scrape records each photo as a signed `fna.fbcdn.net` URL that stops
resolving within days. Captions in the scrape JSON keep indefinitely; pictures
do not. Everything in `manifest.json` can be recovered from the scrape at any
time, but the bytes beside it cannot.

## Re-running it

```
npm run instagram:archive [path/to/dataset.json]
```

Files already on disk are left alone, so this costs nothing to repeat. If it
reports 403s, the scrape has aged out and needs redoing before the missing
pictures can be fetched.

## Curated media

The archive feeds two separate, deliberately narrow upload paths:

- `npm run blob:upload` publishes only the society-owned event posters named in
  `scripts/data/past-events.ts`.
- `npm run media:upload` publishes only the current committee's complete
  announcement cards declared in `scripts/data/curated-media.ts`. It preserves
  the original JPEGs and refuses any source whose manifest owner is not
  `cambridgeurdusoc`.

Both commands use deterministic Blob paths and write committed URL manifests.
Run `npm run db:import-events -- --refresh` for posters and
`npm run db:import-media -- --refresh` for the curated gallery and current
committee portraits. The gallery entries link to the society's original
Instagram videos. The reels and extracted frames are not copied into Blob.

## Licence and permission

These are the society's own posts, taken from its own accounts, for its own
site. Four posts come from partner accounts - `@cambridge_paksoc`,
`@thecambridgemajlis`, `@cfia_2026`, `@ghazalstudiolive` - and are marked as
such in the manifest under `owner`. Ask before republishing those: they are
other societies' photographs of shared events, not ours to use by default.
