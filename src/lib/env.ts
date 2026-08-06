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
  get resendApiKey() {
    return required("RESEND_API_KEY");
  },
  /** Verified sender, e.g. "UrduSoc <hello@urdusoc.example>". */
  get emailFrom() {
    return required("EMAIL_FROM");
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

/** Every variable the app cannot run without, for the preflight check. */
export const REQUIRED_ENV = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
] as const;

export function checkEnv(): { ok: boolean; missing: string[] } {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  return { ok: missing.length === 0, missing };
}
