import Link from "next/link";
import {
  AdminButtonLink,
  AdminPageHeader,
  AdminTable,
  EmptyState,
  PublishBadge,
  Td,
  Th,
} from "@/components/admin/ui";
import { getAdminAlbums } from "@/lib/admin/queries";
import { formatMonthYear } from "@/lib/format";
import { toggleAlbumPublished } from "./actions";
import { requireAdmin } from "@/lib/auth/guard";

export const metadata = { title: "Gallery" };

export default async function AdminGalleryPage() {
  // Guarded here as well as in the layout: a layout is not re-rendered on
  // every navigation, so this is what makes removing someone from the
  // allowlist take effect on the next request rather than the next reload.
  await requireAdmin();

  const albums = await getAdminAlbums();

  return (
    <>
      <AdminPageHeader
        title="Gallery"
        description="Albums of photographs from past events. An album with no photographs shows its motif instead."
        action={<AdminButtonLink href="/admin/gallery/new">New album</AdminButtonLink>}
      />

      {albums.length === 0 ? (
        <EmptyState>No albums yet.</EmptyState>
      ) : (
        <AdminTable
          head={
            <>
              <Th>Album</Th>
              <Th>Taken</Th>
              <Th>Photos</Th>
              <Th>State</Th>
              <Th className="text-right">Actions</Th>
            </>
          }
        >
          {albums.map((album) => (
            <tr key={album.id}>
              <Td>
                <Link
                  href={`/admin/gallery/${album.id}`}
                  className="font-medium underline decoration-rule underline-offset-4 transition-colors hover:decoration-gold"
                >
                  {album.title}
                </Link>
                {album.description ? (
                  <span className="mt-0.5 block max-w-md text-xs text-ink-muted">
                    {album.description}
                  </span>
                ) : null}
              </Td>

              <Td className="whitespace-nowrap text-ink-muted">
                {album.takenOn ? formatMonthYear(album.takenOn) : "-"}
              </Td>

              <Td>
                {album.photoCount === 0 ? (
                  <span className="text-ink-muted">
                    None - showing {album.motif ?? "motif"}
                  </span>
                ) : (
                  album.photoCount
                )}
              </Td>

              <Td>
                <PublishBadge published={album.published} />
              </Td>

              <Td className="text-right whitespace-nowrap">
                <form action={toggleAlbumPublished} className="inline">
                  <input type="hidden" name="id" value={album.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:decoration-forest"
                  >
                    {album.published ? "Unpublish" : "Publish"}
                  </button>
                </form>
              </Td>
            </tr>
          ))}
        </AdminTable>
      )}
    </>
  );
}
