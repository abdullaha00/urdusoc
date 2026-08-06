# Cambridge University Urdu Society — website mock-up

A single-page UI mock-up for UrduSoc, built with Next.js (App Router), TypeScript
and Tailwind CSS v4. It is front-end only: there is no backend, database, auth,
CMS, payments or ticketing.

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
```

Other scripts: `npm run lint`, `npm run typecheck`, `npm run build`.

## Editing the site

**All copy lives in [`src/lib/content.ts`](src/lib/content.ts).** Change the
event, the featured couplet, the pillars, the footer links or the gallery
captions there — no component edits needed.

Every outbound link currently points at `PLACEHOLDER_LINK` (`"#"`). Replace those
with the society's real Instagram, Cambridge SU, term card and membership URLs,
and swap `CONTACT_EMAIL` for the committee's real address.

## How it is put together

| Path | What it is |
| --- | --- |
| `src/app/layout.tsx` | Fonts (Cormorant Garamond, Inter, Noto Nastaliq Urdu) and page metadata |
| `src/app/globals.css` | Colour, font and shadow tokens; paper texture and ruling helpers |
| `src/app/page.tsx` | Section order for the homepage |
| `src/components/ui.tsx` | Shared bits: buttons, section labels, the `Urdu` text wrapper |
| `src/components/*.tsx` | One file per homepage section |

### Urdu text

Wrap any Urdu in the `Urdu` component from `src/components/ui.tsx`, or set
`lang="ur" dir="rtl"` and the `urdu` class by hand. Nastaliq needs a generous
line height, so the `.urdu` class sets one; override it with Tailwind's
`leading-*` utilities when a heading needs tightening.

### Photographs

`src/components/past-moments.tsx` draws three CSS placeholders in place of real
photos. Swap each `Motif` block for a `next/image` once the society has pictures.
