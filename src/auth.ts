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
        apiKey: env.resendApiKey,
        from: env.emailFrom,
        name: "Email",
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
