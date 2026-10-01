import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { ButtonLink, PageHeader } from "@/components/ui";
import { getDb } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false },
};

type PageProps = { searchParams: Promise<{ token?: string }> };

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  let done = false;

  if (token) {
    const result = await getDb()
      .update(subscribers)
      .set({ status: "unsubscribed", unsubscribedAt: new Date() })
      .where(eq(subscribers.token, token))
      .returning({ id: subscribers.id });

    done = result.length > 0;
  }

  return (
    <PageHeader
      title={done ? "You're unsubscribed." : "We could not find that link."}
      intro={
        done
          ? "You will not hear from us again unless you sign up afresh. No hard feelings - the door is always open."
          : "Unsubscribe links come from the footer of our emails. If this one has stopped working, write to the committee and we will remove you by hand."
      }
    >
      <ButtonLink href="/" variant="outline">
        Back to the site
      </ButtonLink>
    </PageHeader>
  );
}
