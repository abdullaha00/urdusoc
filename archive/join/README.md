# Archived: the site's own membership signup

Membership now happens on the society's Cambridge SU page
(<https://www.cambridgesu.co.uk/organisation/20748/>, kept as
`EXTERNAL_LINKS.cambridgeSu` in `src/lib/content.ts`). Every "Join UrduSoc"
button on the site links there, so this parallel signup flow was taken out of
the app rather than deleted - a future committee may want it back if the SU ever
stops being the front door.

What was here:

- `page.tsx` - the `/join` page (membership tiers beside the form).
- `join-form.tsx` - the client form.
- `actions.ts` - `joinAction`: wrote a row into the `members` table and,
  optionally, added the address to the mailing list.

## To restore

1. `page.tsx` → `src/app/join/page.tsx`, `actions.ts` →
   `src/app/join/actions.ts`, `join-form.tsx` →
   `src/components/join-form.tsx`.
2. Fix the two relative imports back to `@/app/join/actions` and
   `@/components/join-form`.
3. Point the join CTAs back at `/join`: `hero.primaryCta` and
   `joinCta.primaryCta` in `src/lib/content.ts`, plus `src/app/about/page.tsx`
   and `src/app/events/[slug]/page.tsx`.

Nothing else was removed. The `members` table, the admin members screen, and
`membershipTiers` in `src/lib/content.ts` are all still live. The mailing-list
half of the old `actions.ts` was not archived - it moved to
`src/lib/subscribe.ts` and `src/app/subscribe/actions.ts`, which is where this
file's `subscribeEmail` import points.

This directory is excluded from `tsconfig.json` and ESLint, so it is not built
or type-checked; expect it to have drifted from the rest of the codebase.
