import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { VerseForm } from "@/components/admin/verse-form";
import { getAdminVerseById } from "@/lib/admin/queries";

export const metadata = { title: "Edit couplet" };

export default async function EditVersePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
