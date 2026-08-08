import { getAdminEventById, getRegistrations } from "@/lib/admin/queries";
import { getCurrentAdmin } from "@/lib/auth/guard";
import { csvFilename, csvResponse, toCsv } from "@/lib/csv";
import { formatEventDateWithYear, formatEventTime } from "@/lib/format";
import { slugify } from "@/lib/slug";

/**
 * The door list as a spreadsheet.
 *
 * Guarded with `getCurrentAdmin()` rather than `requireAdmin()`: this is a file
 * download, and redirecting an unauthenticated request to the login page would
 * hand back an HTML page saved as a .csv. A 403 is the honest answer.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return new Response("Not authorised.", { status: 403 });
  }

  const { id } = await params;
  const event = await getAdminEventById(id);
  if (!event) {
    return new Response("No such event.", { status: 404 });
  }

  const registrations = await getRegistrations(id);

  const csv = toCsv(
    [
      "Name",
      "Email",
      "Places",
      "Reference",
      "Status",
      "Booked at",
      "Checked in at",
      "Notes",
    ],
    registrations.map((row) => [
      row.name,
      row.email,
      row.quantity,
      row.reference,
      row.status,
      row.createdAt,
      row.checkedInAt,
      row.notes,
    ]),
  );

  const header = `${formatEventDateWithYear(event.startsAt)} at ${formatEventTime(event.startsAt)}, ${event.venue}`;

  return csvResponse(
    csvFilename(`door-list-${slugify(event.title, "event")}`),
    // A title row above the headers so a printed door list identifies itself.
    `${toCsv([event.title], [[header]])}\r\n\r\n${csv}`,
  );
}
