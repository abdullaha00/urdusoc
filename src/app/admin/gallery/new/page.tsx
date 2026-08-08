import { AdminPageHeader } from "@/components/admin/ui";
import { AlbumForm } from "@/components/admin/album-form";
import { getEventOptions } from "@/lib/admin/queries";

export const metadata = { title: "New album" };

export default async function NewAlbumPage() {
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
