import { Resend } from "resend";

/**
 * Standalone bulk credential mailer.
 *
 * Completely separate from account creation: it does NOT read or write any
 * User rows. An admin uploads a sheet of (name, username, password, email)
 * — typically logins issued on another platform such as the Testpress LMS —
 * and each person gets one email with their own login details.
 *
 * Sends via Resend's batch endpoint (max 100 emails per request) so a few
 * hundred recipients go out in a handful of API calls, well inside the
 * serverless time limit and Resend's default 2 requests/second rate limit.
 */

const FROM = process.env.EMAIL_FROM ?? "HiG EDUCAMPUS <no-reply@higeducampus.in>";
const BATCH_SIZE = 100;
const PAUSE_BETWEEN_BATCHES_MS = 600;

export interface CredentialEmailInput {
  row: number;
  name: string;
  username: string;
  password: string;
  email: string;
}

export interface CredentialEmailOptions {
  subject: string;
}

export interface CredentialSendResult {
  row: number;
  email: string;
  status: "sent" | "failed";
  message?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderCredentialEmail(
  r: Pick<CredentialEmailInput, "name" | "username" | "password">,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _opts?: CredentialEmailOptions
): string {
  const p = "margin: 0 0 14px; line-height: 1.6; color: #1F2937;";
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; font-size: 15px; color: #1F2937;">
    <p style="${p}">Dear ${escapeHtml(r.name.trim() || "Student")},</p>
    <p style="${p}">Your Power BI login credentials are provided below for the upcoming training sessions.</p>
    <p style="margin: 0 0 6px; line-height: 1.6; color: #1F2937;"><strong>Login Details:</strong></p>
    <ul style="margin: 0 0 16px; padding-left: 22px; line-height: 1.8; color: #1F2937;">
      <li><strong>Username:</strong> ${escapeHtml(r.username)}</li>
      <li><strong>Password:</strong> ${escapeHtml(r.password)}</li>
    </ul>
    <p style="margin: 0 0 14px; line-height: 1.6; color: #D97706; font-weight: 600;">Please do not log in or perform any activities using this account until instructed by your trainer. Unauthorized access or activity may result in the account being blocked.</p>
    <p style="${p}">Please follow the trainer's instructions carefully.</p>
    <p style="margin: 0; line-height: 1.6; color: #1F2937;">Best regards,<br />Training Team</p>
  </div>`;
}

function renderCredentialText(
  r: Pick<CredentialEmailInput, "name" | "username" | "password">
): string {
  return [
    `Dear ${r.name.trim() || "Student"},`,
    "Your Power BI login credentials are provided below for the upcoming training sessions.",
    "",
    "Login Details:",
    `* Username: ${r.username}`,
    `* Password: ${r.password}`,
    "",
    "Please do not log in or perform any activities using this account until instructed by your trainer. Unauthorized access or activity may result in the account being blocked.",
    "Please follow the trainer's instructions carefully.",
    "",
    "Best regards,",
    "Training Team",
  ].join("\n");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Throws if RESEND_API_KEY is missing (caller turns that into a friendly
 * message). Per-batch API failures are reported per row instead of thrown,
 * so one bad batch doesn't hide the outcome of the others.
 */
export async function sendCredentialEmails(
  rows: CredentialEmailInput[],
  opts: CredentialEmailOptions
): Promise<CredentialSendResult[]> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const results: CredentialSendResult[] = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    if (i > 0) await sleep(PAUSE_BETWEEN_BATCHES_MS);

    try {
      const { error } = await resend.batch.send(
        chunk.map((r) => ({
          from: FROM,
          to: r.email,
          subject: opts.subject,
          html: renderCredentialEmail(r, opts),
          text: renderCredentialText(r),
        }))
      );
      for (const r of chunk) {
        results.push(
          error
            ? { row: r.row, email: r.email, status: "failed", message: error.message }
            : { row: r.row, email: r.email, status: "sent" }
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      for (const r of chunk) {
        results.push({ row: r.row, email: r.email, status: "failed", message });
      }
    }
  }

  return results;
}
