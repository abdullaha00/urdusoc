import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Check your email",
  robots: { index: false },
};

export default function CheckYourEmailPage() {
  return (
    <PageHeader
      label="Committee"
      title="Check your email."
      intro="If that address is on the committee list, a sign-in link is on its way. The link works once and expires after 24 hours."
    />
  );
}
