import { AdminPageHeader } from "@/components/admin/ui";
import { CommitteeForm } from "@/components/admin/committee-form";
import { getAdminCommittee } from "@/lib/admin/queries";

export const metadata = { title: "Add committee member" };

export default async function NewCommitteeMemberPage() {
  // Default to the most recent year so adding to the sitting committee is one
  // less thing to type.
  const roster = await getAdminCommittee();
  const latestYear = roster[0]?.academicYear;

  return (
    <>
      <AdminPageHeader
        title="Add committee member"
        description="Roles without a name yet are fine — put “To be announced” in."
        backHref="/admin/committee"
        backLabel="Committee"
      />
      <CommitteeForm defaultYear={latestYear} />
    </>
  );
}
