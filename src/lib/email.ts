import "server-only";

import { Resend } from "resend";
import { env } from "@/lib/env";
import { society } from "@/lib/content";

/**
 * Thin wrapper over Resend.
 *
 * Sending is optional: with no RESEND_API_KEY and EMAIL_FROM the site still
 * runs, and this becomes a no-op. Callers therefore never need to guard their
 * own calls - but anything that *promises* the user a message will arrive must
 * check `env.emailEnabled` and say something different.
 *
 * What gets logged depends on the environment, on purpose. In development the
 * whole message is printed so a committee developer can follow their own
 * sign-in link without an email account. In production only the recipient and
 * subject are printed: the body of a sign-in message contains a link that is
 * as good as a password, and deployment logs are not the place for it.
 */

type SendArgs = {
  to: string;
  subject: string;
  /** Plain text body. Lines are joined with newlines. */
  lines: string[];
  /** Optional one-click unsubscribe URL, for mailing-list messages. */
  unsubscribeUrl?: string;
};

let client: Resend | undefined;

function getClient(apiKey: string): Resend {
  if (!client) client = new Resend(apiKey);
  return client;
}

/** Wraps the plain-text lines in the society's letterhead. */
function renderHtml(lines: string[], unsubscribeUrl?: string): string {
  const paragraphs = lines
    .map(
      (line) =>
        `<p style="margin:0 0 16px;line-height:1.6;color:#22201c;">${escapeHtml(line)}</p>`,
    )
    .join("");

  const footer = unsubscribeUrl
    ? `<p style="margin:24px 0 0;font-size:12px;color:#5b5348;">
         You are receiving this because you joined the UrduSoc mailing list.
         <a href="${unsubscribeUrl}" style="color:#886220;">Unsubscribe</a>.
       </p>`
    : "";

  return `<div style="background:#faf6ec;padding:32px;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:560px;margin:0 auto;background:#faf6ec;border:1px solid #e2d7c2;padding:32px;">
      <p style="margin:0 0 24px;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#5b5348;">
        ${escapeHtml(society.name)}
      </p>
      ${paragraphs}
      ${footer}
    </div>
  </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendEmail({
  to,
  subject,
  lines,
  unsubscribeUrl,
}: SendArgs): Promise<void> {
  const apiKey = env.resendApiKey;
  const from = env.emailFrom;

  if (!apiKey || !from) {
    console.info(
      process.env.NODE_ENV === "production"
        ? `[email not configured - not sent] to: ${to} - subject: ${subject}`
        : `\n[email not configured - not sent]\n  to: ${to}\n  subject: ${subject}\n  ${lines.join("\n  ")}\n`,
    );
    return;
  }

  const { error } = await getClient(apiKey).emails.send({
    from,
    to,
    subject,
    text: lines.join("\n\n"),
    html: renderHtml(lines, unsubscribeUrl),
    ...(unsubscribeUrl
      ? { headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` } }
      : {}),
  });

  if (error) {
    throw new Error(`Resend refused the message: ${error.message}`);
  }
}
