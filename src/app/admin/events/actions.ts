"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import {
  eventCategoryEnum,
  eventKindEnum,
  events,
  registrations,
  ticketingModeEnum,
} from "@/lib/db/schema";
import { env } from "@/lib/env";
import { isUniqueViolation, reportUnexpected } from "@/lib/errors";
import { parseLondonDateTime } from "@/lib/format";
import { slugify } from "@/lib/slug";

export type EventFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * A `datetime-local` value, read as a London wall clock.
 *
 * `parseLondonDateTime` returns null on anything malformed, which `transform` +
 * `refine` turns into a field error rather than an Invalid Date reaching the
 * database.
 */
const londonDateTime = z
  .string()
  .trim()
  .min(1, "Please give a date and time.")
  .transform(parseLondonDateTime)
  .refine((value): value is Date => value !== null, "That is not a valid date.");

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((value) => (value ? value : null));

const eventSchema = z
  .object({
    title: z.string().trim().min(1, "Please give the event a title.").max(200),
    titleUrdu: z.string().trim().max(200).optional().transform((v) => v || null),
    slug: z.string().trim().max(120).optional(),
    kind: z.enum(eventKindEnum.enumValues),
    kindUrdu: z.string().trim().max(60).optional().transform((v) => v || null),
    summary: z
      .string()
      .trim()
      .min(1, "One sentence, used on the event card.")
      .max(300),
    body: optionalText,
    startsAt: londonDateTime,
    // Optional, but a value that is present and unparseable must be reported
    // rather than quietly becoming "no end time".
    endsAt: z
      .string()
      .trim()
      .optional()
      .transform((value, ctx) => {
        if (!value) return null;
        const parsed = parseLondonDateTime(value);
        if (!parsed) {
          ctx.addIssue({ code: "custom", message: "That is not a valid date." });
          return z.NEVER;
        }
        return parsed;
      }),
    // Optional: an event can be announced before the room is booked, and
    // events recovered from old term cards never recorded one.
    venue: z.string().trim().max(200).optional().transform((v) => v || null),
    showTime: z.boolean(),
    capacity: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? Number(value) : null))
      .refine(
        (value) => value === null || (Number.isInteger(value) && value > 0),
        "Capacity must be a whole number, or blank for uncapped.",
      ),
    ticketing: z.enum(ticketingModeEnum.enumValues),
    category: z.enum(eventCategoryEnum.enumValues),
    isCollaboration: z.boolean(),
    // Comma separated in the form; blanks dropped so "PakSoc, " does not become
    // a co-host with an empty name.
    collaborators: z
      .string()
      .trim()
      .optional()
      .transform((value) =>
        value
          ? value
              .split(",")
              .map((name) => name.trim())
              .filter((name) => name.length > 0)
          : [],
      ),
    featured: z.boolean(),
    priority: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? Number(value) : 0))
      .refine(
        (value) => Number.isInteger(value),
        "Priority must be a whole number.",
      ),
    posterUrl: z.string().trim().max(500).optional().transform((v) => v || null),
    posterAlt: z.string().trim().max(300).optional().transform((v) => v || null),
    instagramUrl: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((value, ctx) => {
        if (!value) return null;
        try {
          const url = new URL(value);
          if (!["instagram.com", "www.instagram.com"].includes(url.hostname)) {
            ctx.addIssue({
              code: "custom",
              message: "Use the post's own Instagram link.",
            });
            return z.NEVER;
          }
          return url.toString();
        } catch {
          ctx.addIssue({ code: "custom", message: "Enter a valid URL." });
          return z.NEVER;
        }
      }),
    published: z.boolean(),
  })
  .refine(
    (data) => data.endsAt === null || data.endsAt > data.startsAt,
    { message: "The end time must be after the start.", path: ["endsAt"] },
  )
  // A poster with no description is unreachable for anyone using a screen
  // reader, and several of our posters carry the guest's name.
  .refine((data) => data.posterUrl === null || data.posterAlt !== null, {
    message: "Describe the poster so it is not lost to screen readers.",
    path: ["posterAlt"],
  });

/**
 * True when the spreadsheet owns this event.
 *
 * Checked on the server in every write action, not just hidden in the UI. The
 * admin pages stop offering these controls for sheet-owned rows, but a stale
 * tab or a hand-made request would otherwise still get through - and the edit
 * would survive only until the next sync overwrote it, which looks exactly
 * like the site losing someone's work.
 */
async function isSheetOwned(id: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ key: events.sheetRowKey })
    .from(events)
    .where(eq(events.id, id))
    .limit(1);

  return Boolean(row?.key);
}

function collectFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}

/**
 * Creates or updates an event, depending on whether a hidden `id` is present.
 *
 * `redirect()` is called after the try/catch on purpose: it works by throwing,
 * so calling it inside would be caught and reported as an unexpected failure.
 */
export async function saveEvent(
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();

  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    titleUrdu: formData.get("titleUrdu") ?? undefined,
    slug: formData.get("slug") ?? undefined,
    kind: formData.get("kind"),
    kindUrdu: formData.get("kindUrdu") ?? undefined,
    summary: formData.get("summary"),
    body: formData.get("body") ?? undefined,
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt") ?? undefined,
    venue: formData.get("venue") ?? undefined,
    // The checkbox asks the inverse - ticking it means the hour is not settled.
    showTime: formData.get("timeTbc") !== "on",
    capacity: formData.get("capacity") ?? undefined,
    ticketing: formData.get("ticketing"),
    category: formData.get("category"),
    isCollaboration: formData.get("isCollaboration") === "on",
    collaborators: formData.get("collaborators") ?? undefined,
    featured: formData.get("featured") === "on",
    priority: formData.get("priority") ?? undefined,
    posterUrl: formData.get("posterUrl") ?? undefined,
    posterAlt: formData.get("posterAlt") ?? undefined,
    instagramUrl: formData.get("instagramUrl") ?? undefined,
    published: formData.get("published") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the form.",
      fieldErrors: collectFieldErrors(parsed.error),
    };
  }

  const id = String(formData.get("id") ?? "").trim();
  const data = parsed.data;

  if (id && (await isSheetOwned(id))) {
    return {
      status: "error",
      message:
        "This event comes from the committee spreadsheet. Change its row there - " +
        "anything saved here would be overwritten by the next sync.",
    };
  }

  // A new event entered here while the sheet is connected would never be
  // synced, and would sit outside the one place the committee is told to look.
  if (!id && env.eventsSheetEnabled) {
    return {
      status: "error",
      message:
        "New events are added as a row in the committee spreadsheet, not here.",
    };
  }

  // Paid ticketing has no payment provider behind it - there is no `stripe`
  // dependency, and the join form already refuses paid tiers. Accepting it here
  // would list an event people cannot actually pay for.
  if (data.ticketing === "paid") {
    return {
      status: "error",
      message:
        "Paid ticketing is not switched on yet. Use RSVP and collect payment separately.",
      fieldErrors: { ticketing: "Not available." },
    };
  }

  const values = {
    title: data.title,
    titleUrdu: data.titleUrdu,
    slug: data.slug ? slugify(data.slug, "event") : slugify(data.title, "event"),
    kind: data.kind,
    kindUrdu: data.kindUrdu,
    summary: data.summary,
    body: data.body,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    venue: data.venue,
    showTime: data.showTime,
    capacity: data.capacity,
    ticketing: data.ticketing,
    pricePence: 0,
    category: data.category,
    isCollaboration: data.isCollaboration,
    // Co-hosts only mean something on a collaboration; clearing the tick clears
    // the names too, so a toggled-off event cannot keep a stale partner list.
    collaborators: data.isCollaboration ? data.collaborators : [],
    featured: data.featured,
    priority: data.featured ? data.priority : 0,
    posterUrl: data.posterUrl,
    posterAlt: data.posterUrl ? data.posterAlt : null,
    instagramUrl: data.instagramUrl,
    published: data.published,
    updatedAt: new Date(),
  };

  try {
    if (id) {
      await getDb().update(events).set(values).where(eq(events.id, id));
    } else {
      await getDb().insert(events).values(values);
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        status: "error",
        message: "Another event already uses that web address.",
        fieldErrors: { slug: "Already taken - try a different one." },
      };
    }
    return { status: "error", message: reportUnexpected("Save event failed", error) };
  }

  redirect("/admin/events");
}

export async function toggleEventPublished(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // The sheet's Published column decides this for the rows it owns.
  if (await isSheetOwned(id)) {
    redirect("/admin/events?error=sheet-owned");
  }

  await getDb()
    .update(events)
    .set({ published: sql`not ${events.published}`, updatedAt: new Date() })
    .where(eq(events.id, id));

  redirect("/admin/events");
}

/**
 * Deletes an event - but never one that people have booked onto.
 *
 * `registrations.eventId` cascades on delete, so removing an event with
 * bookings would silently destroy the door list. Unpublishing is the reversible
 * action and is what the UI pushes people towards.
 */
export async function deleteEvent(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Deleting a sheet-owned event would achieve nothing: its row is still in
  // the spreadsheet, so the next sync would put it straight back.
  if (await isSheetOwned(id)) {
    redirect("/admin/events?error=sheet-owned");
  }

  const db = getDb();

  const [booked] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(registrations)
    .where(
      and(eq(registrations.eventId, id), ne(registrations.status, "cancelled")),
    );

  if ((booked?.value ?? 0) > 0) {
    redirect("/admin/events?error=has-registrations");
  }

  await db.delete(events).where(eq(events.id, id));

  redirect("/admin/events");
}
