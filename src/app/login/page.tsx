import type { Metadata } from "next";
import { signIn } from "@/auth";
import { Field, Input } from "@/components/form";
import { FormMessage } from "@/components/form";
import { PageHeader, buttonBase, buttonVariants } from "@/components/ui";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Committee sign in",
  robots: { index: false },
};

type PageProps = {
  searchParams: Promise<{ error?: string; from?: string }>;
};

const ERROR_COPY: Record<string, string> = {
  AccessDenied:
    "That address is not on the committee list. If you have just taken over a role, ask a current committee member to add you.",
  Verification:
    "That sign-in link has expired or has already been used. Request a fresh one below.",
  Configuration:
    "Sign-in is not available: this deployment cannot send email yet.",
  Default: "We could not sign you in. Please try again.",
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { error, from } = await searchParams;

  // Sign-in *is* an email here, so with sending switched off every attempt
  // would fail on submit. Say so up front rather than after a wasted try.
  if (!env.emailEnabled) {
    return (
      <PageHeader
        label="Committee"
        title="Sign in is not available yet."
        intro="Committee sign-in works by emailing you a link, and this site is not set up to send email yet."
      >
        <div className="max-w-md">
          <FormMessage tone="error">
            Once RESEND_API_KEY and EMAIL_FROM are configured, this page will
            email you a sign-in link. Until then the committee pages cannot be
            reached — see .env.example.
          </FormMessage>
        </div>
      </PageHeader>
    );
  }

  return (
    <PageHeader
      label="Committee"
      title="Sign in."
      intro="Committee members only. We will email you a link — there is no password to lose or hand over."
    >
      <div className="max-w-md">
        {error ? (
          <div className="mb-6">
            <FormMessage tone="error">
              {ERROR_COPY[error] ?? ERROR_COPY.Default}
            </FormMessage>
          </div>
        ) : null}

        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("resend", {
              email: String(formData.get("email") ?? "")
                .trim()
                .toLowerCase(),
              redirectTo: from ?? "/admin",
            });
          }}
          className="flex flex-col gap-5"
        >
          <Field label="Committee email" htmlFor="login-email" required>
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </Field>

          <div>
            <button
              type="submit"
              className={`${buttonBase} ${buttonVariants.primary}`}
            >
              Email me a link
            </button>
          </div>
        </form>
      </div>
    </PageHeader>
  );
}
