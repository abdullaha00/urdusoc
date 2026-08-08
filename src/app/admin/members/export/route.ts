import { getMembers } from "@/lib/admin/queries";
import { getCurrentAdmin } from "@/lib/auth/guard";
import { csvFilename, csvResponse, toCsv } from "@/lib/csv";

/** The membership list, filtered exactly as the page that linked here was. */
export async function GET(request: Request): Promise<Response> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return new Response("Not authorised.", { status: 403 });
  }

  const url = new URL(request.url);
  const members = await getMembers({
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
  });

  const csv = toCsv(
    ["Name", "Email", "CRSid", "Type", "Status", "Joined", "Expires", "Added"],
    members.map((member) => [
      member.name,
      member.email,
      member.crsid,
      member.type,
      member.status,
      member.joinedAt,
      member.expiresAt,
      member.createdAt,
    ]),
  );

  return csvResponse(csvFilename("members"), csv);
}
