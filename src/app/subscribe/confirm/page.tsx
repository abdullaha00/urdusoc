import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { ButtonLink, PageHeader } from "@/components/ui";
import { getDb } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirm your subscription",
  robots: { index: false },
};

type PageProps = { searchParams: Promise<{ token?: string }> };

async function confirmToken(token: string | undefined) {
  if (!token) return "invalid" as const;

  const db = getDb();
  const [subscriber] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.token, token))
    .limit(1);

  if (!subscriber) return "invalid" as const;
  if (subscriber.status === "confirmed") return "already" as const;

  await db
    .update(subscribers)
    .set({ status: "confirmed", confirmedAt: new Date(), unsubscribedAt: null })
    .where(eq(subscribers.id, subscriber.id));

  return "confirmed" as const;
}

export default async function ConfirmSubscriptionPage({
  searchParams,
}: PageProps) {
  const { token } = await searchParams;
  const result = await confirmToken(token);

  const copy = {
    confirmed: {
      title: "You're on the list.",
      body: "We will write a handful of times a term — mushairas, socials, and the term card. Every email has an unsubscribe link.",
    },
    already: {
      title: "You were already on the list.",
      body: "Nothing more to do. We will see you at the next mushaira.",
    },
    invalid: {
      title: "That link has expired.",
      body: "Confirmation links are single use. Sign up again and we will send a fresh one.",
    },
  }[result];

  return (
    <PageHeader label="Mailing list" title={copy.title} intro={copy.body}>
      <ButtonLink href={result === "invalid" ? "/join" : "/events"}>
        {result === "invalid" ? "Sign up again" : "See what's coming up"}
      </ButtonLink>
    </PageHeader>
  );
}
