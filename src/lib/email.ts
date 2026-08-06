import "server-only";

import { Resend } from "resend";
import { env } from "@/lib/env";
import { society } from "@/lib/content";

/**
 * Thin wrapper over Resend.
 *
 * In development without a RESEND_API_KEY the message is logged instead of
 * sent, so the whole site can be worked on without an email account.
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

function getClient(): Resend {
  if (!client) client = new Resend(env.resendApiKey);
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
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not set; cannot send email.");
    }
    console.info(
      `\n[email skipped — no RESEND_API_KEY]\n  to: ${to}\n  subject: ${subject}\n  ${lines.join("\n  ")}\n`,
    );
    return;
  }

  const { error } = await getClient().emails.send({
    from: env.emailFrom,
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
