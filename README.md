# Cambridge University Urdu Society — website

The society's website. A Next.js application with a Postgres database, a
committee admin, event RSVPs, membership sign-ups, a photo gallery and a
mailing list — built so that a non-technical committee can inherit it each year
without also inheriting a pile of third-party accounts they cannot get back
into.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Drizzle ORM · Postgres (Neon) · Auth.js v5 · Resend · Vercel Blob · Leaflet ·
Zod.

## Getting started

Local setup needs no Postgres install, no Docker and no accounts. An in-process
Postgres (PGlite) stands in for the real thing, and emails — including your own
committee sign-in link — are printed to the terminal instead of being sent.

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
| `npm run db:import-events` | Import past events from `scripts/data/past-events.ts` — re-runnable |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:verify` | Migrations, seed and schema invariants against a disposable Postgres — no secrets needed |
| `npm run lint` / `npm run typecheck` / `npm run build` | The usual |

Run `npm run db:verify` after any schema change. It is the closest thing here to
a test suite.

### Everything degrades rather than crashes

Only `DATABASE_URL` and `AUTH_SECRET` are genuinely required. The rest switch
features off instead of breaking the build:

| Unset | Effect |
| --- | --- |
| `RESEND_API_KEY` + `EMAIL_FROM` | No email is sent. Public pages all work; RSVPs and sign-ups still succeed and show the booking reference on screen; the mailing-list opt-in is hidden. **Committee sign-in is an email, so `/admin` is unreachable** — locally the link is printed to the terminal instead. |
| `BLOB_READ_WRITE_TOKEN` | The gallery photo uploader is hidden. Albums fall back to their CSS motif. |

Nothing reads a secret at import time, so `next build` succeeds on a fresh clone
with no `.env.local` at all.

## What it does

**Public site** — home, `/events` (upcoming and past, colour-coded by category,
with RSVP), `/urdu` (verse archive in Nastaliq, with transliteration and
translation), `/history` (a Leaflet map of places in Cambridge with a thread to
Urdu literary history), `/gallery`, `/outreach`, `/about`, `/committee`
(current and past cohorts), `/contact`, `/join`, plus mailing-list double
opt-in and one-click unsubscribe.

RSVPs are capacity-aware, allow one booking per address per event, and issue a
short door reference (`URDU-4K7P2M`) using an alphabet with no `0/O/1/I/L`, so a
reference read aloud at the door cannot be transcribed two ways.

**Committee admin** at `/admin` — overview dashboard, and CRUD for events,
verses, committee roster and gallery albums. Members, subscribers and per-event
registrations are listed and exportable as CSV (with a UTF-8 BOM so Urdu names
survive Excel, and formula-injection escaping).

Sign-in is by emailed magic link, deliberately not OAuth: there is no Google or
Microsoft app registration for a future committee to lose the keys to, only an
allowlist row in our own database. Only addresses in the `admins` table may sign
in at all, so a magic link that reaches a stranger is useless, and the allowlist
is re-read on every request — removing someone at handover takes effect
immediately, even if their session cookie is still valid.

The allowlist is edited at `/admin/access`, which is owner-only. Editors can
change everything the society publishes — events, verses, the roster, the
gallery — while owners can additionally decide who may sign in. The page
refuses to remove or demote the last owner, so the committee cannot lock itself
out of its own site.

Bootstrapping is the one step that needs a shell, because the first owner has
nobody to add them: set `SEED_ADMIN_EMAIL` and run `npm run db:seed`. Every
committee member after that is added through `/admin/access`.

## How it is put together

| Path | What it is |
| --- | --- |
| `src/app/` | Routes. Server Components by default; mutations are Server Actions. |
| `src/app/admin/` | The committee admin |
| `src/lib/db/schema.ts` | Drizzle schema — the source of truth for the database |
| `src/lib/queries.ts` | Every read the public pages perform |
| `src/lib/admin/queries.ts` | Reads for the admin |
| `src/lib/content.ts` | Static copy: nav, pillars, membership tiers, term cards, footer |
| `src/lib/heritage.ts` | The `/history` map locations, as data rather than a table |
| `src/lib/palette.ts` | Which of the two colour palettes the site renders in — a one-word edit |
| `src/lib/env.ts` | Environment variables, read lazily |
| `src/lib/email.ts` | Resend wrapper; a no-op when unconfigured |
| `src/lib/csv.ts` | CSV export, hardened for Excel |
| `src/auth.ts` | Auth.js config and the sign-in allowlist check |
| `src/lib/auth/guard.ts` | `requireAdmin()` / `requireOwner()` — the real authorization check |
| `src/proxy.ts` | Optimistic cookie redirect for `/admin`. **Not** an authorization layer. |
| `drizzle/` | Generated SQL migrations — committed, never hand-edited |
| `attachments/` | Prototypes left by previous committees, kept as reference |

Conventions worth knowing before changing anything:

- **Authorization lives in `requireAdmin()`, not in `proxy.ts`.** The proxy only
  checks that a session cookie exists, to spare signed-out visitors a database
  round trip. Every admin page and every admin Server Action calls
  `requireAdmin()` itself.
- **Money is integer pence.** Never floats.
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
without it nobody can sign in. `RESEND_API_KEY` and `EMAIL_FROM` must also be
set in production, because the sign-in link is an email — unlike locally, where
it is printed to the terminal. Once that first owner is in, the rest of the
committee is added at `/admin/access` with no further shell access.

Operational details — which society account owns the domain, the Resend sender,
the Instagram — live in the committee's private handover notes rather than in
this public repository.

## Licence

[MIT](LICENSE) for the source code.

The logo, term cards, Cambridge SU mark, gallery photographs and quoted verse
are **not** covered — they belong to the society and to their respective
authors. If you are reusing this for another society, swap in your own branding
and content first; see the scope note in [LICENSE](LICENSE).
