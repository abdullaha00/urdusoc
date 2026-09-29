import { getSubscribers } from "@/lib/admin/queries";
import { getCurrentAdmin } from "@/lib/auth/guard";
import { csvFilename, csvResponse, toCsv } from "@/lib/csv";

/**
 * The mailing list.
 *
 * The opt-in token is deliberately not exported: it is the credential behind
 * both the confirm and one-click unsubscribe links, and a spreadsheet passed
 * between committees is no place for it.
 */
export async function GET(request: Request): Promise<Response> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return new Response("Not authorised.", { status: 403 });
  }

  const url = new URL(request.url);
  const subscribers = await getSubscribers({
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });

  const csv = toCsv(
    ["Email", "Status", "Source", "Confirmed", "Unsubscribed", "Added"],
    subscribers.map((subscriber) => [
      subscriber.email,
      subscriber.status,
      subscriber.source,
      subscriber.confirmedAt,
      subscriber.unsubscribedAt,
      subscriber.createdAt,
    ]),
  );

  return csvResponse(csvFilename("mailing-list"), csv);
}
