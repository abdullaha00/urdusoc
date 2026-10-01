import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { CommitteeForm } from "@/components/admin/committee-form";
import { getCommitteeMemberById } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guard";

export const metadata = { title: "Edit committee member" };

export default async function EditCommitteeMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Guarded here as well as in the layout: a layout is not re-rendered on
  // every navigation, so this is what makes removing someone from the
  // allowlist take effect on the next request rather than the next reload.
  await requireAdmin();

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
