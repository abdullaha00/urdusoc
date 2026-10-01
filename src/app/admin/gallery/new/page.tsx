import { AdminPageHeader } from "@/components/admin/ui";
import { AlbumForm } from "@/components/admin/album-form";
import { getEventOptions } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth/guard";

export const metadata = { title: "New album" };

export default async function NewAlbumPage() {
  // Guarded here as well as in the layout: a layout is not re-rendered on
  // every navigation, so this is what makes removing someone from the
  // allowlist take effect on the next request rather than the next reload.
  await requireAdmin();

  const events = await getEventOptions();

  return (
    <>
      <AdminPageHeader
        title="New album"
        description="Create the album first, then add photographs to it."
        backHref="/admin/gallery"
        backLabel="Gallery"
      />
      <AlbumForm events={events} />
    </>
  );
}
