/**
 * Environment variables, read lazily.
 *
 * Nothing is validated at import time on purpose: `next build` must succeed on
 * a machine with no secrets (CI, a fresh clone). A variable is only demanded at
 * the moment something actually needs it, and the error names the variable.
 *
 * Run `npm run check:env` to verify a deployment has everything it needs.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. See .env.example and HANDOVER.md.`,
    );
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const env = {
  /** Postgres connection string (Neon in production). */
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  /** Signing secret for Auth.js sessions. Generate with `npx auth secret`. */
  get authSecret() {
    return required("AUTH_SECRET");
  },
  /**
   * Resend credential. Optional — see `emailEnabled`.
   */
  get resendApiKey() {
    return optional("RESEND_API_KEY");
  },
  /** Verified sender, e.g. "UrduSoc <hello@urdusoc.example>". Optional. */
  get emailFrom() {
    return optional("EMAIL_FROM");
  },
  /**
   * Whether the site can send email at all.
   *
   * Both halves are needed: a key with no verified sender is refused by Resend,
   * and a sender with no key cannot authenticate. When this is false the site
   * still runs — `sendEmail` becomes a no-op and the features that depend on a
   * message actually arriving are hidden rather than silently failing.
   *
   * The one thing this cannot soften is committee sign-in, which *is* an email.
   * Without it `/admin` is unreachable; see README.
   */
  get emailEnabled() {
    return Boolean(optional("RESEND_API_KEY") && optional("EMAIL_FROM"));
  },
  /**
   * Vercel Blob token for gallery uploads.
   *
   * Optional on purpose, and deliberately not in REQUIRED_ENV: a society with
   * no photographs yet should still be able to run the whole site. The admin
   * hides the uploader when this is unset rather than failing.
   */
  get blobToken() {
    return optional("BLOB_READ_WRITE_TOKEN");
  },
  /** Public origin, used in emails and callbacks. */
  get siteUrl() {
    return (
      optional("NEXT_PUBLIC_SITE_URL") ??
      (optional("VERCEL_PROJECT_PRODUCTION_URL")
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000")
    );
  },
} as const;

/**
 * Every variable the app cannot run without, for the preflight check.
 *
 * RESEND_API_KEY and EMAIL_FROM are deliberately absent: the site serves every
 * public page without them. They are needed for committee sign-in and for the
 * mailing list, both of which degrade visibly rather than crashing.
 */
export const REQUIRED_ENV = ["DATABASE_URL", "AUTH_SECRET"] as const;

export function checkEnv(): { ok: boolean; missing: string[] } {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  return { ok: missing.length === 0, missing };
}
