# Archived: the per-event pages (`/events/<slug>`) and RSVP

Taken out for the time being. `/events` is now the whole public programme: the
featured rows state the summary, the co-host line and the price, and those rows,
the programme list and the hero programme are labels to read rather than things
to click. No page links to `/events/<slug>` any more, so the route simply does
not exist.

The RSVP form went with it. It only ever appeared on an event's own page, so
with that page gone there was nowhere to put it. The `registrations` table and
the admin door list (`/admin/events/<id>/registrations`, including the CSV
export) are untouched and still show anything booked before this.

What was here:

- `page.tsx` - the `/events/[slug]` page: hero, details table, body, poster,
  schema.org `Event` JSON-LD, and the booking column.
- `actions.ts` - `rsvpAction`: capacity check, row in `registrations`,
  confirmation email, `revalidatePath`.
- `rsvp-form.tsx` - the client form.

## To restore

1. `page.tsx` → `src/app/events/[slug]/page.tsx`, `actions.ts` →
   `src/app/events/[slug]/actions.ts`, `rsvp-form.tsx` →
   `src/components/rsvp-form.tsx`.
2. Put the links back: `FeaturedRow` and `EventRow` in
   `src/components/event-postcard.tsx` and `EventProgramme` in
   `src/components/hero-events.tsx` all wrap their contents in a `next/link` to
   `/events/<slug>` again, with the `group`/`group-hover` and
   `hover:border-gold` classes that went with it. (Both of those were cards in a
   grid and a carousel when this was archived; they are list rows now, and the
   layout is a matter of taste rather than of this removal.)
3. Point the admin screens back at the page: the `action` link in
   `src/app/admin/events/[id]/edit/page.tsx` and the `Slug` row below it
   (was `Web address` → `/events/<slug>`), plus the `Slug` field's hint in
   `src/components/admin/event-form.tsx`.

`getEventBySlug` and `getEventAvailability` in `src/lib/queries.ts` were left in
place - nothing calls them at the moment. Slugs are still stored, validated and
de-duplicated by the spreadsheet sync (`src/lib/sheets/sync.ts`), so restoring
the route does not need a data migration.

This directory is excluded from `tsconfig.json` and ESLint, so it is not built
or type-checked; expect it to have drifted from the rest of the codebase.
