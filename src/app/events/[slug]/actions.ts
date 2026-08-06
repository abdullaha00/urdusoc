"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { events, registrations } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { isUniqueViolation, reportUnexpected, UserFacingError } from "@/lib/errors";
import { formatEventDateWithYear, formatEventTime } from "@/lib/format";
import { generateReference } from "@/lib/reference";

export type RsvpState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  reference?: string;
};

const rsvpSchema = z.object({
  name: z.string().trim().min(1, "Please tell us your name.").max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("That does not look like an email address."))
    .describe("email"),
  quantity: z.coerce
    .number()
    .int()
    .min(1, "At least one place.")
    .max(4, "Please book at most four places at a time."),
  notes: z.string().trim().max(500).optional(),
});

/** Raised when the last seats go while someone is filling the form in. */
class CapacityError extends Error {}

export async function rsvpAction(
  _previous: RsvpState,
  formData: FormData,
): Promise<RsvpState> {
  // Honeypot: only a bot fills this in.
  if (formData.get("company")) {
    return { status: "success", message: "Thank you — your place is booked." };
  }

  const parsed = rsvpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    quantity: formData.get("quantity") ?? 1,
    notes: formData.get("notes") ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", message: "Please check the form.", fieldErrors };
  }

  const slug = String(formData.get("slug") ?? "");
  const { name, email, quantity, notes } = parsed.data;
  const db = getDb();
  const reference = generateReference();

  let event: typeof events.$inferSelect | undefined;

  try {
    await db.transaction(async (tx) => {
      // Lock the event row so two people cannot claim the last seat at once.
      const [locked] = await tx
        .select()
        .from(events)
        .where(and(eq(events.slug, slug), eq(events.published, true)))
        .for("update")
        .limit(1);

      if (!locked) throw new UserFacingError("This event is no longer listed.");
      event = locked;

      if (locked.ticketing !== "rsvp") {
        throw new UserFacingError("This event does not take RSVPs.");
      }

      if (locked.startsAt.getTime() < Date.now()) {
        throw new UserFacingError("This event has already taken place.");
      }

      if (locked.capacity !== null) {
        const [row] = await tx
          .select({
            taken: sql<number>`coalesce(sum(${registrations.quantity}), 0)::int`,
          })
          .from(registrations)
          .where(
            and(
              eq(registrations.eventId, locked.id),
              sql`${registrations.status} <> 'cancelled'`,
            ),
          );

        if ((row?.taken ?? 0) + quantity > locked.capacity) {
          throw new CapacityError();
        }
      }

      await tx.insert(registrations).values({
        eventId: locked.id,
        name,
        email,
        quantity,
        notes,
        reference,
        status: "reserved",
      });
    });
  } catch (error) {
    if (error instanceof CapacityError) {
      return {
        status: "error",
        message:
          "We just ran out of places for this one. Join the mailing list and we will tell you when the next is announced.",
      };
    }

    // Unique index on (event, email) — they have already booked.
    if (isUniqueViolation(error, "registrations_event_email_idx")) {
      return {
        status: "error",
        message:
          "That address is already on the list for this event. Email us if you need to change your booking.",
      };
    }

    if (error instanceof UserFacingError) {
      return { status: "error", message: error.message };
    }

    return {
      status: "error",
      message: reportUnexpected("RSVP failed", error),
    };
  }

  if (event) {
    try {
      await sendEmail({
        to: email,
        subject: `You're booked: ${event.title}`,
        lines: [
          `Assalam-o-alaikum ${name},`,
          `Your place at ${event.title} is booked.`,
          `${formatEventDateWithYear(event.startsAt)} at ${formatEventTime(event.startsAt)}`,
          `${event.venue}`,
          `Your reference is ${reference} — bring it to the door.`,
          `If you can no longer make it, reply to this email so we can offer your place to someone else.`,
          `${env.siteUrl}/events/${event.slug}`,
        ],
      });
    } catch (error) {
      // The booking is saved; a failed email must not lose it.
      console.error("RSVP confirmation email failed", error);
    }
  }

  revalidatePath(`/events/${slug}`);

  return {
    status: "success",
    message: "Your place is booked — check your email for the details.",
    reference,
  };
}
