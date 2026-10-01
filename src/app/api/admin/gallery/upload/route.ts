import { issueSignedToken } from "@vercel/blob";
import {
  handleUpload,
  handleUploadPresigned,
  type HandleUploadBody,
  type HandleUploadPresignedBody,
} from "@vercel/blob/client";
import { getAdminAlbumById } from "@/lib/admin/queries";
import { getCurrentAdmin } from "@/lib/auth/guard";
import { env } from "@/lib/env";

/** 12MB - comfortably above a phone photo, well below anything pathological. */
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function authoriseAlbum(clientPayload: string | null) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authorised to upload.");

  const album = clientPayload
    ? await getAdminAlbumById(clientPayload)
    : null;
  if (!album) throw new Error("No such album.");
  return album;
}

/**
 * Delegates gallery uploads straight from the browser to Vercel Blob.
 *
 * Project OIDC uses a short-lived signed delegation and presigned URL. A
 * legacy read/write token remains supported for projects that already use one.
 * Both paths authenticate the admin and constrain the file before authorising
 * any upload.
 */
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as
    | HandleUploadBody
    | HandleUploadPresignedBody;

  try {
    if (body.type === "blob.generate-presigned-url") {
      if (env.blobUploadMode !== "presigned") {
        throw new Error("Presigned Blob uploads are not configured.");
      }

      const result = await handleUploadPresigned({
        body,
        request,
        webhookPublicKey: env.blobWebhookPublicKey,
        getSignedToken: async (pathname, clientPayload) => {
          const album = await authoriseAlbum(clientPayload);
          if (!pathname.startsWith(`gallery/${album.id}/`)) {
            throw new Error("Upload path does not match the album.");
          }

          const validUntil = Date.now() + 10 * 60 * 1000;
          return {
            token: await issueSignedToken({
              pathname,
              operations: ["put"],
              allowedContentTypes: ALLOWED_CONTENT_TYPES,
              maximumSizeInBytes: MAX_UPLOAD_BYTES,
              validUntil,
            }),
            urlOptions: {
              addRandomSuffix: true,
              allowOverwrite: false,
              validUntil,
            },
          };
        },
      });

      return Response.json(result);
    }

    if (body.type !== "blob.generate-client-token") {
      throw new Error("Unsupported Blob upload request.");
    }
    if (env.blobUploadMode !== "legacy") {
      throw new Error("Legacy Blob uploads are not configured.");
    }

    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const album = await authoriseAlbum(clientPayload);

        // The same check the presigned branch makes. The browser chooses the
        // pathname, so without this an admin's page could be made to write
        // anywhere in the store — committee portraits, album covers — rather
        // than only into the album it is uploading to.
        if (!pathname.startsWith(`gallery/${album.id}/`)) {
          throw new Error("Upload path does not match the album.");
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: album.id,
        };
      },
      // No completion callback: it cannot reach localhost. addPhoto writes the
      // row once the browser has the uploaded URL.
    });

    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload could not be authorised.";
    return Response.json({ error: message }, { status: 400 });
  }
}
