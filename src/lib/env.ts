/**
 * Environment variables, read lazily.
 *
 * Nothing is validated at import time on purpose: `next build` must succeed on
 * a machine with no secrets (CI, a fresh clone). A variable is only demanded at
 * the moment something actually needs it, and the error names the variable.
 *
 * `checkEnv()` below reports what a deployment is still missing without
 * throwing - use it for a preflight check rather than reading these getters.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. See .env.example.`,
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
   * Raven sign-in, which is OIDC over Google. Optional - see `ravenEnabled`.
   *
   * Registered in the Google Cloud Console; see .env.example for who should own
   * the client. Not in REQUIRED_ENV because the whole public site works without
   * it - only `/admin` needs it.
   */
  get googleClientId() {
    return optional("AUTH_GOOGLE_ID");
  },
  get googleClientSecret() {
    return optional("AUTH_GOOGLE_SECRET");
  },
  /**
   * Whether committee sign-in is possible at all.
   *
   * Both halves are needed to complete an OAuth exchange. When this is false
   * `/login` says so up front rather than bouncing people off Google with a
   * placeholder client id.
   */
  get ravenEnabled() {
    return Boolean(optional("AUTH_GOOGLE_ID") && optional("AUTH_GOOGLE_SECRET"));
  },
  /**
   * Resend credential. Optional - see `emailEnabled`.
   */
  get resendApiKey() {
    return optional("RESEND_API_KEY");
  },
  /**
   * Verified sender, e.g.
   * "Cambridge University Urdu Society <hello@urdusoc.example>". Optional.
   *
   * Spell the society out in the display name rather than abbreviating it. This
   * is the line a recipient reads in their inbox before they open anything, and
   * it is the one place where an unrecognised "UrduSoc" costs us - the subject
   * stays short because Gmail truncates it on a phone at around thirty-five
   * characters, so the sender has to carry the recognition.
   */
  get emailFrom() {
    return optional("EMAIL_FROM");
  },
  /**
   * Whether the site can send email at all.
   *
   * Both halves are needed: a key with no verified sender is refused by Resend,
   * and a sender with no key cannot authenticate. When this is false the site
   * still runs - `sendEmail` becomes a no-op and the features that depend on a
   * message actually arriving are hidden rather than silently failing.
   *
   * Committee sign-in used to be the exception, because it *was* an email. It
   * is Raven now, so `/admin` no longer depends on this - see `ravenEnabled`.
   */
  get emailEnabled() {
    return Boolean(optional("RESEND_API_KEY") && optional("EMAIL_FROM"));
  },
  /** Optional legacy credential for Blob commands and browser uploads. */
  get blobToken() {
    return optional("BLOB_READ_WRITE_TOKEN");
  },
  /** Store id paired with Vercel's short-lived project OIDC token. */
  get blobStoreId() {
    return optional("BLOB_STORE_ID");
  },
  get vercelOidcToken() {
    return optional("VERCEL_OIDC_TOKEN");
  },
  /** Verifies completion callbacks in the Blob presigned upload helper. */
  get blobWebhookPublicKey() {
    return optional("BLOB_WEBHOOK_PUBLIC_KEY");
  },
  /** Server-side Blob commands such as `del` support OIDC directly. */
  get blobConfigured() {
    return Boolean(
      optional("BLOB_READ_WRITE_TOKEN") ||
        (optional("BLOB_STORE_ID") && optional("VERCEL_OIDC_TOKEN")),
    );
  },
  /**
   * Browser uploads use a presigned URL with OIDC, or the older client-token
   * flow when a read/write token is explicitly configured.
   */
  get blobUploadMode(): "presigned" | "legacy" | null {
    if (
      optional("BLOB_STORE_ID") &&
      optional("VERCEL_OIDC_TOKEN") &&
      optional("BLOB_WEBHOOK_PUBLIC_KEY")
    ) {
      return "presigned";
    }
    return optional("BLOB_READ_WRITE_TOKEN") ? "legacy" : null;
  },
  /**
   * The Google Sheet the committee types events into, and the service account
   * allowed to read it. See .env.example for how to create both.
   *
   * Optional as a group: without them the sync is switched off and `/admin`
   * falls back to editing events by hand, which is what the site did before.
   */
  get eventsSheetId() {
    return optional("EVENTS_SHEET_ID");
  },
  /** A1 range to read, e.g. "Events!A:U". Defaults to the first sheet. */
  get eventsSheetRange() {
    return optional("EVENTS_SHEET_RANGE") ?? "Events!A:V";
  },
  get googleServiceAccountEmail() {
    return optional("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  },
  /**
   * The service account's PEM private key.
   *
   * Dashboards and `.env` files mangle real newlines, so the escaped form
   * ("-----BEGIN…\nMIIE…") is accepted and unescaped here. Without that the
   * key parses as a single line and every signature fails with an opaque
   * OpenSSL error.
   */
  get googleServiceAccountKey() {
    return optional("GOOGLE_SERVICE_ACCOUNT_KEY")?.replace(/\\n/g, "\n");
  },
  /**
   * Whether the sheet is wired up. All three parts are needed: an id with no
   * credentials cannot be read, and credentials with no id have nothing to
   * read. When false the admin says so rather than failing a sync.
   */
  get eventsSheetEnabled() {
    return Boolean(
      optional("EVENTS_SHEET_ID") &&
        optional("GOOGLE_SERVICE_ACCOUNT_EMAIL") &&
        optional("GOOGLE_SERVICE_ACCOUNT_KEY"),
    );
  },
  /** Where to send a committee member who wants to edit an event. */
  get eventsSheetUrl() {
    const id = optional("EVENTS_SHEET_ID");
    return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : null;
  },
  /**
   * Shared secret Vercel Cron sends as `Authorization: Bearer …`.
   *
   * Vercel sets this for you when you add a cron job. Locally it is usually
   * unset, and the sync route then refuses every request - use the button in
   * /admin/events or `npm run sheet:sync` instead of trying to curl it.
   */
  get cronSecret() {
    return optional("CRON_SECRET");
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
 * public page without them. They are needed for the mailing list and for the
 * confirmation emails, which degrade visibly rather than crashing.
 *
 * AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are absent for the same reason: without
 * them every public page still works and only `/admin` is unreachable, which
 * `/login` explains rather than crashing.
 */
export const REQUIRED_ENV = ["DATABASE_URL", "AUTH_SECRET"] as const;

export function checkEnv(): { ok: boolean; missing: string[] } {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  return { ok: missing.length === 0, missing };
}
