import { AdminPageHeader } from "@/components/admin/ui";
import { VerseForm } from "@/components/admin/verse-form";
import { requireAdmin } from "@/lib/auth/guard";

export const metadata = { title: "Add couplet" };

export default async function NewVersePage() {
  // Guarded here as well as in the layout: a layout is not re-rendered on
  // every navigation, so this is what makes removing someone from the
  // allowlist take effect on the next request rather than the next reload.
  await requireAdmin();

  return (
    <>
      <AdminPageHeader
        title="Add couplet"
        description="Goes into the archive on /urdu. Tick the box to put it on the homepage."
        backHref="/admin/verses"
        backLabel="Verses"
      />
      <VerseForm />
    </>
  );
}
