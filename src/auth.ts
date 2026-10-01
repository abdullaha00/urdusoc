import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getDb } from "@/lib/db";
import {
  accounts,
  admins,
  sessions,
  users,
  verificationTokens,
} from "@/lib/db/schema";
import { env } from "@/lib/env";

/**
 * Committee sign-in, through Raven.
 *
 * Raven's current form is OIDC over Google - UIS run it as a Google Workspace
 * domain and document it as OpenID Connect - so this is the stock Auth.js
 * Google provider pinned to `cam.ac.uk`. The older ucam-webauth/WLS protocol is
 * deprecated by UIS and deliberately not used.
 *
 * The point of Raven is that the committee has no credential specific to this
 * site: the only thing they can lose is their University account, which already
 * has the University's own two-factor in front of it. What we own is the
 * allowlist, which decides who may sign in at all.
 *
 * The trade-off, and it is a real one: there is now a Google OAuth client that a
 * future committee can lose the keys to. It must belong to a society role
 * account rather than a graduating student, and if it is ever lost the only way
 * back in is `SEED_ADMIN_EMAIL` + `npm run db:seed` from a shell. See README.
 *
 * The config is a function so nothing touches the database or reads secrets
 * until a request actually arrives - `next build` must work without them.
 */

/** The only domain Raven can vouch for. */
const UNIVERSITY_DOMAIN = "@cam.ac.uk";

/**
 * How long a committee member stays signed in, idle, before Raven asks again.
 *
 * Change this one number to change the policy. It is generous because the
 * allowlist is re-read on every admin request (see `requireAdmin()`), so
 * removing someone does not wait for their session to expire - session length
 * costs us nothing in revocation terms.
 */
const SESSION_MAX_AGE_DAYS = 30;
const SESSION_MAX_AGE = SESSION_MAX_AGE_DAYS * 24 * 60 * 60;

export const { handlers, signIn, signOut, auth } = NextAuth(() => {
  const db = getDb();

  return {
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      // Unused now that sign-in is Raven rather than a magic link, but kept so
      // that adding an email provider back needs no migration.
      verificationTokensTable: verificationTokens,
    }),
    session: {
      strategy: "database",
      maxAge: SESSION_MAX_AGE,
      // Refresh the row at most daily rather than on every request.
      updateAge: 24 * 60 * 60,
    },
    cookies: {
      /**
       * Auth.js writes the session cookie with no `maxAge` of its own, which
       * makes it a browser-session cookie until some later request happens to
       * refresh it - so quitting the browser signed you out. Setting it here is
       * what makes staying signed in actually work.
       *
       * Only the lifetime is overridden. The *name* must stay the default,
       * because `src/proxy.ts` looks for it by name.
       */
      sessionToken: { options: { maxAge: SESSION_MAX_AGE } },
    },
    trustHost: true,
    pages: {
      signIn: "/login",
      error: "/login",
    },
    providers: [
      Google({
        // Placeholders when Raven is not configured. The provider needs both to
        // construct, and `auth()` runs on every admin request - so reading a
        // required() value here would 500 the whole admin rather than just
        // failing to sign in. `/login` checks `env.ravenEnabled` and says so.
        clientId: env.googleClientId ?? "raven-not-configured",
        clientSecret: env.googleClientSecret ?? "raven-not-configured",
        name: "Raven",
        authorization: {
          params: {
            // Scopes the Google account chooser to the University, so a
            // committee member with a personal Google account signed in
            // elsewhere is not offered it. A hint only - `signIn` below is what
            // actually enforces the domain.
            hd: "cam.ac.uk",
            prompt: "select_account",
          },
        },
        /**
         * Needed, not incidental: committee members already have `users` rows
         * created by the magic-link provider this replaces, and without this
         * their first Raven sign-in fails with `OAuthAccountNotLinked`.
         *
         * "Dangerous" in the general case because an OAuth provider that does
         * not verify email addresses would let someone claim another user's
         * account. That does not apply here - we require `email_verified` and a
         * `cam.ac.uk` address below, and the allowlist decides access
         * regardless of how the user row came to exist.
         */
        allowDangerousEmailAccountLinking: true,
      }),
    ],
    callbacks: {
      /**
       * Two gates: the address must be a University one that Raven has actually
       * verified, and it must be on the committee allowlist.
       *
       * The domain is checked here rather than trusted from the `hd` parameter
       * above, which is only a hint on the way *out* to Google and says nothing
       * about who came back.
       */
      async signIn({ user, profile }) {
        const email = user.email?.toLowerCase();
        if (!email) return false;
        if (profile && profile.email_verified === false) return false;
        if (!email.endsWith(UNIVERSITY_DOMAIN)) return false;

        const [admin] = await db
          .select({ id: admins.id })
          .from(admins)
          .where(eq(admins.email, email))
          .limit(1);
        return Boolean(admin);
      },
      async session({ session, user }) {
        const email = user.email?.toLowerCase();
        if (email) {
          const [admin] = await db
            .select({ role: admins.role, name: admins.name })
            .from(admins)
            .where(eq(admins.email, email))
            .limit(1);
          session.user.role = admin?.role;
        }
        return session;
      },
    },
    events: {
      async signIn({ user }) {
        const email = user.email?.toLowerCase();
        if (!email) return;
        await db
          .update(admins)
          .set({ lastSignInAt: new Date() })
          .where(eq(admins.email, email));
      },
    },
  };
});
