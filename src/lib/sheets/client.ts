/**
 * Reading a Google Sheet as a service account.
 *
 * Hand-rolled rather than pulling in `googleapis`, which is a ~50MB dependency
 * tree for the one endpoint we use. The whole protocol is: sign a JWT with the
 * service account's private key, swap it for an access token, call the Sheets
 * REST API. That is what is below.
 *
 * Read-only by design - the scope requested is `spreadsheets.readonly`, so a
 * leaked key cannot be used to rewrite the committee's spreadsheet.
 *
 * No `server-only` marker, unlike most of src/lib: `scripts/sync-events.mts`
 * imports this from plain Node, where that package throws. Nothing here is
 * reachable from a client component - the only importer is ./sync.ts.
 */

import { createSign } from "node:crypto";
import { env } from "@/lib/env";
import { UserFacingError } from "@/lib/errors";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

/** Google rejects assertions older than an hour; this is comfortably inside. */
const TOKEN_LIFETIME_SECONDS = 3600;

/**
 * Renew this many seconds before the token actually expires, so a request that
 * starts just under the wire does not arrive just over it.
 */
const RENEW_MARGIN_SECONDS = 60;

function base64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Cached across invocations within one warm function instance.
 *
 * Worth doing: Fluid Compute reuses instances, so a cron run and the admin
 * button a minute later would otherwise mint two tokens for no reason.
 */
let cachedToken: { value: string; expiresAtMs: number } | undefined;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAtMs > Date.now()) {
    return cachedToken.value;
  }

  const clientEmail = env.googleServiceAccountEmail;
  const privateKey = env.googleServiceAccountKey;

  if (!clientEmail || !privateKey) {
    throw new UserFacingError(
      "The Google service account is not configured. See .env.example.",
    );
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const claims = {
    iss: clientEmail,
    scope: SCOPE,
    aud: TOKEN_ENDPOINT,
    iat: issuedAt,
    exp: issuedAt + TOKEN_LIFETIME_SECONDS,
  };

  const signingInput = `${base64Url(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  )}.${base64Url(JSON.stringify(claims))}`;

  let signature: string;
  try {
    const signer = createSign("RSA-SHA256");
    signer.update(signingInput);
    signature = base64Url(signer.sign(privateKey));
  } catch {
    // Almost always a key pasted without its newlines, or with the surrounding
    // JSON quotes left on. Naming that is more use than the OpenSSL message.
    throw new UserFacingError(
      "The Google private key could not be read. Check GOOGLE_SERVICE_ACCOUNT_KEY " +
        "includes the BEGIN/END lines and its newlines survived being pasted.",
    );
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${signingInput}.${signature}`,
    }),
    // This is a live credential exchange; a cached one would be worse than
    // useless. Next.js caches fetch responses in some configurations.
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Google token exchange failed:", response.status, detail);
    throw new UserFacingError(
      "Google refused the service account credentials. Check the client email " +
        "and private key, and that the Sheets API is enabled for the project.",
    );
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!payload.access_token) {
    throw new UserFacingError("Google returned no access token.");
  }

  const lifetime = payload.expires_in ?? TOKEN_LIFETIME_SECONDS;
  cachedToken = {
    value: payload.access_token,
    expiresAtMs: Date.now() + (lifetime - RENEW_MARGIN_SECONDS) * 1000,
  };

  return cachedToken.value;
}

/**
 * The cells of `range`, as the strings a person sees in the browser.
 *
 * Formatted values on purpose: a date cell read unformatted comes back as a
 * serial number like 46321, and a committee member who typed "23/10/2026" is
 * entitled to have that read back. `parseSheetDate` handles the spellings.
 *
 * Trailing empty cells are omitted by the API, so rows are ragged - callers
 * must index defensively. `cellAt` in ./event-row.ts does.
 */
export async function fetchSheetValues(): Promise<string[][]> {
  const spreadsheetId = env.eventsSheetId;
  if (!spreadsheetId) {
    throw new UserFacingError("EVENTS_SHEET_ID is not set. See .env.example.");
  }

  const token = await getAccessToken();
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId,
    )}/values/${encodeURIComponent(env.eventsSheetRange)}`,
  );
  url.searchParams.set("valueRenderOption", "FORMATTED_VALUE");
  url.searchParams.set("majorDimension", "ROWS");

  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (response.status === 403) {
    throw new UserFacingError(
      "The service account cannot see that spreadsheet. Share the sheet with " +
        `${env.googleServiceAccountEmail} as a Viewer.`,
    );
  }

  if (response.status === 404) {
    // The id's length is named because the failure that actually happens is a
    // stray character travelling with it - a quote kept from a .env line, a
    // %20 from a copied URL. "That id is 45 characters" is the sentence that
    // ends the hunt; "no spreadsheet with that id" sends you to look at the
    // sheet, which is fine.
    throw new UserFacingError(
      `No spreadsheet with the id EVENTS_SHEET_ID holds (${spreadsheetId.length} ` +
        "characters). It should be the id from the sheet's URL - the part " +
        "between /d/ and /edit - with no quotes or spaces around it.",
    );
  }

  if (response.status === 400) {
    throw new UserFacingError(
      `The sheet has no range "${env.eventsSheetRange}". Check the tab is named ` +
        "Events, or set EVENTS_SHEET_RANGE to match.",
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Google Sheets read failed:", response.status, detail);
    throw new UserFacingError(
      "Could not read the spreadsheet. Please try again in a moment.",
    );
  }

  const payload = (await response.json()) as { values?: string[][] };
  return payload.values ?? [];
}
