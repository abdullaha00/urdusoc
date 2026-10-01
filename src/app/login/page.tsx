import type { Metadata } from "next";
import { signIn } from "@/auth";
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
  // Covers both halves of the check in `signIn`: not a University address, and
  // a University address that nobody has added yet. Deliberately does not say
  // which - it is the same remedy either way, and it tells a stranger nothing.
  AccessDenied:
    "That account cannot sign in. The committee pages need your University (Raven) account, and the address has to have been added by a current committee member. If you have just taken over a role, ask them to add you.",
  OAuthAccountNotLinked:
    "That address is already registered here in another form. Ask a committee member to check the access list.",
  OAuthCallbackError:
    "Raven did not complete the sign-in. Please try again - if it keeps happening, the site's Raven credentials may need renewing.",
  /**
   * Auth.js reports one `Configuration` for two very different things: a config
   * that really is missing, *and* any `AdapterError` - which in practice means
   * the database was unreachable.
   *
   * The missing-credentials case cannot reach this copy, because the
   * `ravenEnabled` branch below returns before the error is ever rendered. So by
   * the time this is shown the credentials exist and something else broke,
   * almost always the database. Saying "not set up yet" here sent a previous
   * reader looking for a configuration mistake that was not there.
   */
  Configuration:
    "Sign-in is set up, but something on our side is not working right now - most likely the site cannot reach its database. Trying a different account will not help. If you look after this site, check the server log for “[auth][error] AdapterError”.",
  Default: "We could not sign you in. Please try again.",
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { error, from } = await searchParams;

  // Without the OAuth client there is nothing to redirect to, so every attempt
  // would bounce off Google with a placeholder client id. Say so up front
  // rather than after a wasted round trip. This applies in development too:
  // unlike the magic link it replaces, Raven has no offline equivalent.
  //
  // This return is also what lets ERROR_COPY.Configuration above be specific:
  // it takes the missing-credentials case off the table. Keep them together.
  if (!env.ravenEnabled) {
    return (
      <PageHeader
        title="Sign in is not available yet."
        intro="Committee sign-in uses your University Raven account, and this site has not been given its Raven credentials yet."
      >
        <div className="max-w-md">
          <FormMessage tone="error">
            Once AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are configured, this page
            will sign you in with Raven. Until then the committee pages cannot
            be reached - see .env.example.
          </FormMessage>
        </div>
      </PageHeader>
    );
  }

  return (
    <PageHeader
      title="Sign in."
      intro="Committee members only. Sign in with your University Raven account - there is no separate password to lose or pass on."
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
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: from ?? "/admin" });
          }}
        >
          <button
            type="submit"
            className={`${buttonBase} ${buttonVariants.primary}`}
          >
            Sign in with Raven
          </button>
        </form>

        <p className="mt-5 text-sm leading-relaxed text-ink-muted">
          You will be sent to the University sign-in page, with whatever
          two-factor step your account already uses.
        </p>
      </div>
    </PageHeader>
  );
}
