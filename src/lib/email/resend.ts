import { Resend } from "resend";

// Constructed lazily, inside each send function, not at module scope.
// The Resend SDK throws synchronously if given an empty/undefined API key —
// Resend is meant to be optional (only needed for password-reset emails),
// so constructing it eagerly at import time would crash the whole app
// (including Next.js's build-time page-data collection) for anyone who
// hasn't configured RESEND_API_KEY yet.
function getResendClient(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.EMAIL_FROM ?? "LMS Portal <no-reply@lms-portal.edu>";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const html = `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #12203D;">
    <h2 style="margin: 0 0 16px; font-size: 20px;">Reset your password</h2>
    <p style="margin: 0 0 16px; line-height: 1.5; color: #33415C;">
      We received a request to reset the password for your LMS Portal account.
      This link expires in 30 minutes and can only be used once.
    </p>
    <a href="${resetUrl}"
       style="display: inline-block; background: #12203D; color: #FAF9F6; text-decoration: none; padding: 12px 20px; border-radius: 4px; font-weight: 600;">
      Reset password
    </a>
    <p style="margin: 24px 0 0; font-size: 13px; color: #6B7280; line-height: 1.5;">
      If you didn't request this, you can safely ignore this email &mdash; your password
      will not change. If you're concerned about your account's security, contact your
      institution's IT administrator.
    </p>
  </div>`;

  return getResendClient().emails.send({
    from: FROM,
    to,
    subject: "Reset your LMS Portal password",
    html,
  });
}

export async function sendPasswordChangedNotice(to: string) {
  const html = `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #12203D;">
    <h2 style="margin: 0 0 16px; font-size: 20px;">Your password was changed</h2>
    <p style="margin: 0 0 16px; line-height: 1.5; color: #33415C;">
      This is a confirmation that the password on your LMS Portal account was just changed.
      If this wasn't you, contact your institution's IT administrator immediately.
    </p>
  </div>`;

  return getResendClient().emails.send({
    from: FROM,
    to,
    subject: "Your LMS Portal password was changed",
    html,
  });
}
