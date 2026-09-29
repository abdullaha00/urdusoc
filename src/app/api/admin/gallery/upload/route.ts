import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getAdminAlbumById } from "@/lib/admin/queries";
import { getCurrentAdmin } from "@/lib/auth/guard";

/** 12MB — comfortably above a phone photo, well below anything pathological. */
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Issues a short-lived token so the browser can upload straight to Blob storage.
 *
 * The bytes never pass through a server action: those cap request bodies at 1MB
 * by default, which no photograph respects. Raising that limit would push whole
 * images through the function instead, so the upload is delegated and only the
 * resulting URL comes back to us.
 *
 * This route sits outside `/admin`, so `proxy.ts` does not cover it — the
 * authorization below is the only thing guarding it, which is why it is done
 * before a token is minted rather than after.
 */
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const admin = await getCurrentAdmin();
        if (!admin) {
          throw new Error("Not authorised to upload.");
        }

        // The album is passed as the client payload; check it exists so a token
        // cannot be minted for an arbitrary path.
        const albumId = clientPayload ?? "";
        const album = albumId ? await getAdminAlbumById(albumId) : null;
        if (!album) {
          throw new Error("No such album.");
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: album.id,
        };
      },
      // Deliberately no `onUploadCompleted`: Vercel calls it from outside, so it
      // never fires against localhost and the photo row would never appear in
      // local development. The row is written by the `addPhoto` action instead,
      // once the browser has the URL.
    });

    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload could not be authorised.";
    return Response.json({ error: message }, { status: 400 });
  }
}
