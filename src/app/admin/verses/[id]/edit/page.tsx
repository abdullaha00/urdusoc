import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { VerseForm } from "@/components/admin/verse-form";
import { getAdminVerseById } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guard";

export const metadata = { title: "Edit couplet" };

export default async function EditVersePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Guarded here as well as in the layout: a layout is not re-rendered on
  // every navigation, so this is what makes removing someone from the
  // allowlist take effect on the next request rather than the next reload.
  await requireAdmin();

  const { id } = await params;
  const verse = await getAdminVerseById(id);

  if (!verse) notFound();

  return (
    <>
      <AdminPageHeader
        title={verse.poetName}
        description={
          verse.featured
            ? "This couplet is on the homepage."
            : "In the archive on /urdu."
        }
        backHref="/admin/verses"
        backLabel="Verses"
      />
      <VerseForm verse={verse} />
    </>
  );
}
