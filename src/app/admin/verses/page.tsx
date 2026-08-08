import Link from "next/link";
import {
  AdminButtonLink,
  AdminPageHeader,
  Badge,
  EmptyState,
} from "@/components/admin/ui";
import { DangerConfirm } from "@/components/admin/danger-confirm";
import { Urdu } from "@/components/ui";
import { getAdminVerses } from "@/lib/admin/queries";
import { deleteVerse, setFeaturedVerse } from "./actions";

export const metadata = { title: "Verses" };

export default async function AdminVersesPage() {
  const verses = await getAdminVerses();
  const featured = verses.find((verse) => verse.featured);

  return (
    <>
      <AdminPageHeader
        title="Verses"
        description="The couplet archive on /urdu. One of them is featured on the homepage."
        action={<AdminButtonLink href="/admin/verses/new">Add couplet</AdminButtonLink>}
      />

      {!featured && verses.length > 0 ? (
        <p className="mb-6 rounded-sm border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-gold-deep">
          No couplet is featured, so the homepage section is empty. Pick one below.
        </p>
      ) : null}

      {verses.length === 0 ? (
        <EmptyState>
          No couplets yet. The homepage and /urdu will both be bare until you add one.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-4">
          {verses.map((verse) => (
            <li
              key={verse.id}
              className="rounded-sm border border-rule bg-paper px-5 py-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <Urdu className="block text-xl leading-[2] text-forest">
                    {verse.urduLines.join(" ")}
                  </Urdu>

                  <p className="mt-2 text-sm text-ink-muted italic">
                    {verse.transliterationLines.join(" · ")}
                  </p>

                  <p className="mt-2 max-w-xl text-sm leading-relaxed">
                    {verse.translation}
                  </p>

                  <p className="mt-3 text-xs tracking-[0.14em] text-ink-muted uppercase">
                    {verse.poetName}
                    {verse.poetYears ? ` · ${verse.poetYears}` : null}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  {verse.featured ? <Badge tone="good">On homepage</Badge> : null}

                  <Link
                    href={`/admin/verses/${verse.id}/edit`}
                    className="text-xs font-medium text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
                  >
                    Edit
                  </Link>

                  {verse.featured ? null : (
                    <form action={setFeaturedVerse}>
                      <input type="hidden" name="id" value={verse.id} />
                      <button
                        type="submit"
                        className="text-xs text-ink-muted underline underline-offset-4 transition-colors hover:text-forest"
                      >
                        Feature this
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-rule/60 pt-3">
                <form action={deleteVerse}>
                  <input type="hidden" name="id" value={verse.id} />
                  <DangerConfirm
                    phrase={verse.poetName}
                    openLabel="Delete couplet…"
                    confirmLabel="Delete couplet"
                    description="Type the poet's name to confirm."
                  />
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
