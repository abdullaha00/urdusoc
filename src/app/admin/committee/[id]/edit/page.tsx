import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { CommitteeForm } from "@/components/admin/committee-form";
import { getCommitteeMemberById } from "@/lib/admin/queries";

export const metadata = { title: "Edit committee member" };

export default async function EditCommitteeMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await getCommitteeMemberById(id);

  if (!person) notFound();

  return (
    <>
      <AdminPageHeader
        title={person.role}
        description={`${person.name} · ${person.academicYear}`}
        backHref="/admin/committee"
        backLabel="Committee"
      />
      <CommitteeForm person={person} />
    </>
  );
}
