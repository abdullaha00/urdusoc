import { AdminPageHeader } from "@/components/admin/ui";
import { VerseForm } from "@/components/admin/verse-form";

export const metadata = { title: "Add couplet" };

export default function NewVersePage() {
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
