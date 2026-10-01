"use server";

import { z } from "zod";
import { getDb } from "@/lib/db";
import { members } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { subscribeEmail } from "@/lib/subscribe";
import { membershipTiers } from "@/lib/content";

export type JoinState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

const tierIds = membershipTiers.map((tier) => tier.id) as [string, ...string[]];

const joinSchema = z.object({
  name: z.string().trim().min(1, "Please tell us your name.").max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("That does not look like an email address.")),
  crsid: z.string().trim().max(16).optional(),
  type: z.enum(tierIds),
  subscribe: z.boolean(),
  consent: z.literal(true, {
    message: "Please confirm you are happy for us to hold your details.",
  }),
});

export async function joinAction(
  _previous: JoinState,
  formData: FormData,
): Promise<JoinState> {
  if (formData.get("company")) {
    return { status: "success", message: "Welcome to UrduSoc." };
  }

  const parsed = joinSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    crsid: formData.get("crsid") || undefined,
    type: formData.get("type"),
    subscribe: formData.get("subscribe") === "on",
    consent: formData.get("consent") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", message: "Please check the form.", fieldErrors };
  }

  const { name, email, crsid, type, subscribe } = parsed.data;
  const tier = membershipTiers.find((entry) => entry.id === type);
  const db = getDb();

  try {
    // Paid tiers are not switched on: the society's payments have to go through
    // whatever the SU permits. When that is settled, this is where a Stripe
    // Checkout session would be created and the member left as "pending".
    if (tier && tier.pricePence > 0) {
      return {
        status: "error",
        message:
          "Paid membership is not open yet. Please email the committee and we will sort it out directly.",
      };
    }

    await db
      .insert(members)
      .values({
        name,
        email,
        crsid,
        type: type as (typeof members.$inferInsert)["type"],
        status: "active",
        pricePence: 0,
        joinedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: members.email,
        set: { name, crsid, type: type as (typeof members.$inferInsert)["type"] },
      });

    // Double opt-in cannot work without a confirmation link to click, so the
    // mailing list is skipped entirely when email is off. The join form hides
    // the checkbox too; this is the server-side half of the same rule.
    if (subscribe && env.emailEnabled) {
      await subscribeEmail(email, "join");
    }
  } catch (error) {
    console.error("Join failed", error);
    return {
      status: "error",
      message: "Something went wrong signing you up. Please try again.",
    };
  }

  // Outside the try: the membership is already saved, and a failed welcome
  // email must not report a successful signup as a failure. This mirrors how
  // the RSVP action treats its confirmation.
  try {
    await sendEmail({
      to: email,
      subject: "Welcome to UrduSoc",
      lines: [
        `Assalam-o-alaikum ${name},`,
        "You're on the list - welcome to the Cambridge University Urdu Society.",
        "We run mushairas, conversation evenings and chai socials through Michaelmas, Lent and Easter. Everything is open to everyone, whatever your Urdu is like.",
        `See what's coming up: ${env.siteUrl}/events`,
      ],
    });
  } catch (error) {
    console.error("Join welcome email failed", error);
  }

  if (!env.emailEnabled) {
    return {
      status: "success",
      message: "Welcome to UrduSoc - you're on the list.",
    };
  }

  return {
    status: "success",
    message: subscribe
      ? "Welcome to UrduSoc. Check your email - there is a link to confirm the mailing list."
      : "Welcome to UrduSoc. Check your email for a note from us.",
  };
}
