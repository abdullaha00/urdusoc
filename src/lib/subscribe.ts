import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { generateToken } from "@/lib/reference";

/**
 * Double opt-in: a row is created as "pending" and only becomes "confirmed"
 * when the address owner clicks the link. Nobody is ever added silently.
 *
 * Deliberately a plain module rather than a server action, so that it is not
 * reachable as an endpoint of its own - callers go through subscribeAction.
 */
export async function subscribeEmail(email: string, source: string) {
  const db = getDb();
  const token = generateToken();

  const [existing] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, email))
    .limit(1);

  if (existing?.status === "confirmed") return;

  if (existing) {
    await db
      .update(subscribers)
      .set({ token, status: "pending", unsubscribedAt: null })
      .where(eq(subscribers.id, existing.id));
  } else {
    await db.insert(subscribers).values({ email, token, source });
  }

  await sendEmail({
    to: email,
    subject: "Confirm your UrduSoc mailing list subscription",
    lines: [
      "One more step: please confirm you would like to hear from the Cambridge University Urdu Society.",
      `${env.siteUrl}/subscribe/confirm?token=${token}`,
      "If you did not ask for this, simply ignore this email and nothing will be sent to you.",
    ],
  });
}
