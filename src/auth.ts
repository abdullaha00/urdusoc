import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { getDb } from "@/lib/db";
import {
  accounts,
  admins,
  sessions,
  users,
  verificationTokens,
} from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

/**
 * Committee sign-in.
 *
 * Magic links rather than OAuth on purpose: there is no Google/Microsoft app
 * registration for a future committee to lose access to, only an allowlist row
 * in our own database.
 *
 * The config is a function so nothing touches the database or reads secrets
 * until a request actually arrives — `next build` must work without them.
 */
export const { handlers, signIn, signOut, auth } = NextAuth(() => {
  const db = getDb();

  return {
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    session: { strategy: "database" },
    trustHost: true,
    pages: {
      signIn: "/login",
      verifyRequest: "/login/check-your-email",
      error: "/login",
    },
    providers: [
      Resend({
        // The provider builds its client eagerly, so it needs *a* key even when
        // the message is sent by `sendVerificationRequest` below. Reading
        // `env.resendApiKey` here would throw before that ever runs, which made
        // signing in locally impossible — see the note on the override.
        // Both are placeholders when email is not configured. The provider
        // needs them to construct, and `auth()` runs on every admin request —
        // so reading a required() value here would 500 the whole admin rather
        // than just failing to send. Nothing is sent through this client
        // anyway; `sendVerificationRequest` below does the work.
        apiKey: env.resendApiKey ?? "not-used-see-below",
        from: env.emailFrom ?? "UrduSoc <noreply@urdusoc.invalid>",
        name: "Email",
        /**
         * Sends the magic link through our own wrapper rather than the
         * provider's default.
         *
         * Two reasons: the link arrives on the society's letterhead like every
         * other message the site sends, and `sendEmail` logs to the console when
         * there is no RESEND_API_KEY, so a committee developer can sign in
         * locally without an email account — which is what `src/lib/email.ts`
         * always promised but auth did not honour.
         */
        async sendVerificationRequest({ identifier, url }) {
          await sendEmail({
            to: identifier,
            subject: "Your UrduSoc committee sign-in link",
            lines: [
              "Here is your sign-in link for the UrduSoc committee pages.",
              url,
              "It can be used once and expires shortly. If you did not ask to sign in, ignore this email.",
            ],
          });
        },
      }),
    ],
    callbacks: {
      /** Only allowlisted committee addresses may sign in at all. */
      async signIn({ user }) {
        const email = user.email?.toLowerCase();
        if (!email) return false;
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
