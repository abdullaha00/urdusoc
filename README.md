# Cambridge University Urdu Society - website

The society's website. A Next.js application with a Postgres database, a
committee admin, event RSVPs, membership sign-ups, a photo gallery and a
mailing list - built so that a non-technical committee can inherit it each year
without also inheriting a pile of third-party accounts they cannot get back
into.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Drizzle ORM · Postgres (Neon) · Auth.js v5 (Raven) · Resend · Vercel Blob ·
Leaflet ·
Zod.

## Getting started

Local setup needs no Postgres install and no Docker. An in-process Postgres
(PGlite) stands in for the real thing, and emails are printed to the terminal
instead of being sent. The one thing you do need an account for is committee
sign-in: Raven has no offline stand-in, so reaching `/admin` locally needs the
Raven credentials from [`.env.example`](.env.example). Every public page works
without them.

```bash
npm install
cp .env.example .env.local   # defaults are fine; leave the optional keys blank
npx auth secret              # fills in AUTH_SECRET

npm run dev:db               # leave running: a local Postgres, migrated + seeded
npm run dev                  # http://localhost:3000
```

Set `DATABASE_URL` to `postgres://postgres:postgres@localhost:5432/postgres` to
point at the database `npm run dev:db` starts.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run dev:db` | Throwaway local Postgres (PGlite), migrated and seeded on start |
| `npm run db:generate` | Generate a migration from `src/lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:seed` | Seed `DATABASE_URL`; `SEED_ADMIN_EMAIL` becomes the first committee login |
| `npm run db:import-events` | Import past events from `scripts/data/past-events.ts` - re-runnable; `--refresh` rewrites rows already there |
| `npm run db:import-committee` | Import every committee from `scripts/data/committee.ts` - re-runnable, and never touches a year someone has edited; `--refresh` overrides that |
| `npm run db:import-media` | Link uploaded current-committee portraits and import three gallery entries that point to the society's original Instagram videos |
| `npm run instagram:archive` | Download the society's Instagram pictures from a scrape before the links expire |
| `npm run blob:upload` | Put the archived event posters in Blob storage and record the URLs in `scripts/data/instagram/uploads.json` |
| `npm run media:upload` | Upload the approved current committee's complete announcement cards, recording them in `media-uploads.json` |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:verify` | Migrations, seed and schema invariants against a disposable Postgres - no secrets needed |
| `npm run sheet:headers` | Print the events spreadsheet's heading row, ready to paste into A1 |
| `npm run sheet:sync` | Run the events sync once from a terminal, printing any rejected rows |
| `npm run sheet:check` | Exercise the sync engine against `npm run dev:db` with canned rows - no Google account needed |
| `npm run lint` / `npm run typecheck` / `npm run build` | The usual |

Run `npm run db:verify` after any schema change, and `npm run sheet:check`
after touching anything under `src/lib/sheets/`. They are the closest thing
here to a test suite.

### Everything degrades rather than crashes

Only `DATABASE_URL` and `AUTH_SECRET` are genuinely required. The rest switch
features off instead of breaking the build:

| Unset | Effect |
| --- | --- |
| `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` | Raven sign-in is off, so `/admin` is unreachable. Every public page still works, and `/login` says so rather than failing mid-redirect. This is the one feature with no offline fallback - it is needed in development too. |
| `RESEND_API_KEY` + `EMAIL_FROM` | No email is sent. Public pages all work; RSVPs and sign-ups still succeed and show the booking reference on screen; the mailing-list opt-in is hidden. Sign-in is unaffected. |
| `BLOB_STORE_ID` + `VERCEL_OIDC_TOKEN` + `BLOB_WEBHOOK_PUBLIC_KEY`, or `BLOB_READ_WRITE_TOKEN` | The gallery photo uploader is hidden. Albums fall back to their CSS motif. |
| `EVENTS_SHEET_ID` + the two `GOOGLE_SERVICE_ACCOUNT_*` | The events spreadsheet is disconnected and `/admin/events` goes back to being an editor, as it was before. Nothing on the public site changes. |

Nothing reads a secret at import time, so `next build` succeeds on a fresh clone
with no `.env.local` at all.

## What it does

**Public site** - home, `/events` (upcoming and past, colour-coded by category,
with RSVP), `/urdu` (verse archive in Nastaliq, with transliteration and
translation), `/history` (a Leaflet map of places in Cambridge with a thread to
Urdu literary history), `/gallery`, `/outreach`, `/about`, `/committee`
(current and past cohorts), `/contact`, plus mailing-list double opt-in and
one-click unsubscribe. Joining the society is not handled here - every "Join
UrduSoc" button links out to the society's Cambridge SU listing, which is where
the SU counts members. The signup form this site used to carry is parked in
`archive/join` (not built or type-checked) in case that changes.

RSVPs are capacity-aware, allow one booking per address per event, and issue a
short door reference (`URDU-4K7P2M`) using an alphabet with no `0/O/1/I/L`, so a
reference read aloud at the door cannot be transcribed two ways.

**Committee admin** at `/admin` - overview dashboard, and CRUD for events,
verses, committee roster and gallery albums. Members, subscribers and per-event
registrations are listed and exportable as CSV (with a UTF-8 BOM so Urdu names
survive Excel, and formula-injection escaping).

Sign-in is **Raven**, the University account the committee already has. Nobody
holds a credential specific to this site, and the account behind it already has
the University's own two-factor step in front of it. Raven's current form is OIDC
over Google - UIS run it as a Google Workspace domain and document it as OpenID
Connect - so this is the stock Auth.js Google provider pinned to `cam.ac.uk`.
The older ucam-webauth/WLS protocol is deprecated by UIS and is not used.

Identity and authorisation are separate. Raven establishes *who you are*; the
`admins` table decides *whether you may sign in*, and it is re-read on every
admin request - so removing someone takes effect immediately, even
if their session cookie is still valid. A University address that nobody has
added gets no further than `/login`. Sessions last 30 days and renew as you use
them, which is safe precisely because revocation does not wait for expiry.

The trade-off, stated plainly because an earlier version of this site avoided it:
there is now a Google OAuth client that a future committee can lose the keys to.
Register it to a **society role account**, not a committee member's personal one,
and record it in the committee's private notes. If it is ever lost, the way back in is
`SEED_ADMIN_EMAIL` + `npm run db:seed`, which needs shell access to the
database - so it is worth checking that someone still has that each year.

Committee members also lose Raven when they graduate. Add the incoming owner
*before* the outgoing one's University account expires, or the seed route is the
only way to appoint their replacement.

The allowlist is edited at `/admin/access`, which is owner-only. Editors can
change everything the society publishes - events, verses, the roster, the
gallery - while owners can additionally decide who may sign in. The page
refuses to remove or demote the last owner, so the committee cannot lock itself
out of its own site.

Bootstrapping is the one step that needs a shell, because the first owner has
nobody to add them: set `SEED_ADMIN_EMAIL` and run `npm run db:seed`. Every
committee member after that is added through `/admin/access`.

## Events come from a spreadsheet

When the `EVENTS_SHEET_*` variables are set, a Google Sheet is the source of
truth for events. The committee types a term's events into it; the site copies
them in once a day (`vercel.json` → `/api/cron/sync-events`), or immediately
when someone presses **Sync now** on `/admin/events`. That page
becomes a read-only view of what the last sync read.

Once a day is the Hobby plan's limit, not a preference. If the committee wants
an edit on the site within minutes without paying for Pro, the spreadsheet can
drive the sync itself: `scripts/apps-script/` holds a Google Apps Script that
adds a **Website** menu to the sheet and an every-five-minutes trigger, calling
the same endpoint with the same secret. Its README has the two settings it
needs.

Columns are found by their **heading**, not their position, so the sheet can be
sorted, reordered, and can carry extra columns of the committee's own. Several
spellings of each heading are accepted - see `COLUMN_ALIASES` in
`src/lib/sheets/event-row.ts`. Only `Title`, `Summary` and `Date` must be
present; everything else is optional.

`npm run sheet:headers` prints the eight columns a term card actually needs:

| Column | Notes |
| --- | --- |
| `Title`, `Summary` | Required. Summary is one sentence, capped at 300 characters - it is printed on a small card. |
| `Date` | Required. Use `TBC` until the date is settled, or enter `2026-10-23`, `23/10/2026` or `23 October 2026`. TBC events appear after dated upcoming events. **Numeric dates are read day-first**, so `05/06/2026` is 5 June. |
| `Start time` | `19:00` or `7pm`. Leave blank or use `TBC` when the hour is not fixed. If the date is TBC, the start time, end date and end time must also be blank or TBC. |
| `Venue` | |
| `Kind` | `mushaira`, `social`, `workshop` or `talk` - a label on the event page. Defaults to `mushaira`. |
| `Category` | `academic`, `cultural` or `social` - the colour on `/events` and its legend. Defaults to `cultural`. |
| `Published` | `yes` puts it on the public site. **Do not remove this column**: it defaults to no, so a sheet without it publishes nothing. |

Add any of these when you need them; the sync picks up a new heading on the
next run, with no deploy:

| Column | Notes |
| --- | --- |
| `Title Urdu`, `Kind Urdu` | Rendered in Nastaliq beside the English. |
| `Body` | Long description, Markdown. |
| `End date`, `End time` | Also accepted as `Finish date` and `Finish time`. An evening written `21:00`–`01:00` with no end date is understood to run past midnight. |
| `Ticketing` | `none` or `rsvp`. Absent means no bookings at all. `paid` is refused - there is no payment provider wired up. |
| `Capacity` | Absent or blank means uncapped. |
| `Collaborators` | Comma-separated. Any value marks the event as a collaboration; there is no separate tick-box to keep in step. |
| `Featured`, `Priority` | Pushes an event into the featured list at the top of `/events`. With none set, that list falls back to the nearest upcoming events. |
| `Poster URL`, `Poster alt` | A poster needs both - a row with a URL and no description is refused. Upload in `/admin/gallery` and paste the address; a Google Drive link will not render. |
| `Slug` | Pins the web address. Blank derives it from the title and date. |
| `Key` | Pins identity. See below. |

`Kind`, `Category` and `Published` are the only columns with a fixed
vocabulary, and a typo in one is the commonest reason a row is skipped. Putting
a **dropdown** on them (Data → Data validation) removes that failure mode.

### Which spreadsheet row is which event

Worked out from the **title and the date** - `slugify(title)-YYYY-MM-DD` - so
there is no bookkeeping column to maintain. Sorting the sheet, inserting rows
and deleting rows are all safe, which is the whole reason identity is not the
row's position: sorting by date is the first thing anyone does to a
spreadsheet, and a positional key would hand one event's database row, and
eventually its door list, to whichever event sorted into its place.

The cost is that **editing a title or a date makes a different event.** The old
one is unpublished and left behind; a new one appears at a new address. Fixing
a typo in a title is therefore not a small edit. Replacing `TBC` with a date
also counts as a date edit, so give an event a `Key` before doing that if it
must remain the same database row.

Two ways out when that matters:

- add a `Slug` column to pin the web address, so at least existing links keep
  working;
- add a `Key` column and put any short word in it. That pins identity outright
  and makes retitling an ordinary update. It is not in the default heading row,
  but it is read whenever it is present - and it is the way out if the society
  ever turns bookings on, where an orphaned row would strand a door list.

Three rules the sync will not break, all enforced in `src/lib/sheets/sync.ts`:

- **It never deletes an event.** `registrations.eventId` cascades on delete, so
  a deleted row would take the door list with it. Removing a row from the sheet
  **unpublishes** the event, which is reversible.
- **It only touches rows it owns** - those with a `sheet_row_key`. The archive
  imported by `npm run db:import-events` - the old term cards, and everything
  recovered from the society's Instagram back to the launch in March 2022 - and
  anything written by hand before the sheet was connected, are invisible to it
  and still editable in `/admin`.
- **A web address never moves on its own.** An event's slug is fixed when it is
  first created and later edits do not change it, because `/events/…` links go
  out on Instagram and on printed posters weeks ahead. Filling in the `Slug`
  column is how you ask for a move.

A row that fails validation is skipped and reported against its spreadsheet row
number - "Row 14: Date "sometime in March" is not one we can read" - on
`/admin/events` and in the output of `npm run sheet:sync`. The rest of the sheet
still goes through.

Bookings, posters and photographs stay in the database: the sheet holds only
what a person can sensibly type into a cell. RSVPs are taken on the site and
read at `/admin/events/[id]/registrations` as before.

## How it is put together

| Path | What it is |
| --- | --- |
| `src/app/` | Routes. Server Components by default; mutations are Server Actions. |
| `src/app/admin/` | The committee admin |
| `src/lib/db/schema.ts` | Drizzle schema - the source of truth for the database |
| `src/lib/queries.ts` | Every read the public pages perform |
| `src/lib/admin/queries.ts` | Reads for the admin |
| `src/lib/sheets/` | The events spreadsheet: `client.ts` reads it, `event-row.ts` validates a row, `sync.ts` applies it |
| `scripts/apps-script/` | Not part of the app: the Apps Script pasted into the spreadsheet, so the sheet can sync itself |
| `src/lib/content.ts` | Static copy: nav, pillars, membership tiers, term cards, footer |
| `src/lib/heritage.ts` | The `/history` map locations, as data rather than a table |
| `src/lib/palette.ts` | Which of the two colour palettes the site renders in - a one-word edit |
| `src/lib/env.ts` | Environment variables, read lazily |
| `src/lib/email.ts` | Resend wrapper; a no-op when unconfigured |
| `src/lib/csv.ts` | CSV export, hardened for Excel |
| `src/auth.ts` | Auth.js config - Raven provider, session lifetime, allowlist check |
| `src/lib/auth/guard.ts` | `requireAdmin()` / `requireOwner()` - the real authorization check |
| `src/proxy.ts` | Optimistic cookie redirect for `/admin`. **Not** an authorization layer. |
| `drizzle/` | Generated SQL migrations - committed, never hand-edited |
| `attachments/` | Prototypes left by previous committees, kept as reference |

Conventions worth knowing before changing anything:

- **Authorization lives in `requireAdmin()`, not in `proxy.ts`.** The proxy only
  checks that a session cookie exists, to spare signed-out visitors a database
  round trip. Every admin page and every admin Server Action calls
  `requireAdmin()` itself.
- **Money is integer pence.** Never floats.
- **The events sync never deletes and never moves a URL.** See the section
  above before changing anything in `src/lib/sheets/`.
- **Copy that isn't in the database is in `src/lib/content.ts`.**

### Urdu text

Wrap Urdu in the `Urdu` component from `src/components/ui.tsx`, or set
`lang="ur" dir="rtl"` and the `urdu` class by hand. Nastaliq needs a generous
line height, so `.urdu` sets one; override it with Tailwind's `leading-*`
utilities when a heading needs tightening.

## Known gaps

Flagged in the source at the point they matter, and repeated here so they are
not discovered by a reader of the live site:

- **The Iqbal couplet is unverified.** The Urdu in `src/lib/content.ts` came
  from a committee brief that flagged it as AI-drafted. A fluent reader should
  check both lines.
- **The `/history` entries are mostly unsourced.** Only the Iqbal lodgings entry
  cites anything. See the warning at the top of `src/lib/heritage.ts`; the
  hedged wording in some entries is deliberate.
- **`public/su-logo.svg` is a stand-in** for the real Cambridge SU logo.

## Deployment

Built for Vercel with Neon Postgres and Vercel Blob from the Vercel
Marketplace. Set the variables in [`.env.example`](.env.example), using Neon's
**pooled** connection string, then run `npm run db:migrate` and
`npm run db:seed` once against production.

Set `SEED_ADMIN_EMAIL` for that seed run: it becomes the first owner, and
without it nobody can sign in. It must be a University address
(`crsid@cam.ac.uk`), since sign-in is Raven. `AUTH_GOOGLE_ID` and
`AUTH_GOOGLE_SECRET` must also be set, with the deployed domain added to the
OAuth client's redirect URIs. Once that first owner is in, the rest of the
committee is added at `/admin/access` with no further shell access.

`vercel.json` declares the cron job that syncs the events spreadsheet, at
06:00 UTC daily. The sync was written for `*/15 * * * *` and that is the right
schedule for it — a Hobby account is limited to one run a day, and a deployment
carrying `*/15` is refused outright. If the society's account ever moves to Pro,
changing that one line is all it takes. (`vercel.json` takes no comments, which
is why this is written here instead.)

Vercel picks the job up on the next production deployment and sets
`CRON_SECRET` itself; the route refuses every request until it does. Cron jobs
only run against production deployments, so previews never sync - press **Sync
now** in `/admin/events` if you need a preview to catch up.

Operational details - which society account owns the domain, the Raven (Google)
OAuth client, the Resend sender, the events spreadsheet and its service
account, the Instagram - live in the committee's private notes rather than in
this public repository.

## Licence

[MIT](LICENSE) for the source code.

The logo, term cards, Cambridge SU mark, gallery photographs and quoted verse
are **not** covered - they belong to the society and to their respective
authors. If you are reusing this for another society, swap in your own branding
and content first; see the scope note in [LICENSE](LICENSE).
