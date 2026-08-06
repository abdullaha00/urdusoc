import type { Metadata } from "next";
import { signIn } from "@/auth";
import { Field, Input } from "@/components/form";
import { FormMessage } from "@/components/form";
import { PageHeader, buttonBase, buttonVariants } from "@/components/ui";

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
    "That address is not on the committee list. If you have just taken over a role, ask the outgoing officer to add you at /admin/access.",
  Verification:
    "That sign-in link has expired or has already been used. Request a fresh one below.",
  Default: "We could not sign you in. Please try again.",
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { error, from } = await searchParams;

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
