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

const FROM = process.env.EMAIL_FROM ?? "HiG EDUCAMPUS <no-reply@higeducampus.in>";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const html = `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #12203D;">
    <h2 style="margin: 0 0 16px; font-size: 20px;">Reset your password</h2>
    <p style="margin: 0 0 16px; line-height: 1.5; color: #33415C;">
      We received a request to reset the password for your HiG EDUCAMPUS account.
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
    subject: "Reset your HiG EDUCAMPUS password",
    html,
  });
}

export async function sendPasswordChangedNotice(to: string) {
  const html = `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #12203D;">
    <h2 style="margin: 0 0 16px; font-size: 20px;">Your password was changed</h2>
    <p style="margin: 0 0 16px; line-height: 1.5; color: #33415C;">
      This is a confirmation that the password on your HiG EDUCAMPUS account was just changed.
      If this wasn't you, contact your institution's IT administrator immediately.
    </p>
  </div>`;

  return getResendClient().emails.send({
    from: FROM,
    to,
    subject: "Your HiG EDUCAMPUS password was changed",
    html,
  });
}

/**
 * Sends a new account's login credentials, optionally with an admin's
 * custom message. Callers must catch/handle failures themselves — this
 * throws whenever RESEND_API_KEY isn't configured (Resend is optional
 * in this project), and account creation should never fail just because
 * the welcome email couldn't be sent.
 */
export async function sendWelcomeCredentialsEmail(
  to: string,
  name: string,
  loginEmail: string,
  password: string,
  loginUrl: string,
  customMessage?: string
) {
  const html = `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #12203D;">
    <h2 style="margin: 0 0 16px; font-size: 22px;">🎓 Welcome to HiG EDUCAMPUS!</h2>
    <p style="margin: 0 0 12px; line-height: 1.5; color: #33415C;">
      Dear ${name},
    </p>
    <p style="margin: 0 0 20px; line-height: 1.5; color: #33415C;">
      Welcome to the HiG EDUCAMPUS Learning Management System (LMS)! 🎉 We&rsquo;re excited to
      have you join us and begin your learning journey with HiG EDUCAMPUS.
    </p>
    <p style="margin: 0 0 16px; line-height: 1.5; color: #33415C;">
      Here are your login details:
    </p>
    <div style="background: #FAF9F6; border: 1px solid #12203D1A; border-radius: 4px; padding: 16px 20px; margin: 0 0 16px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #33415C;"><strong>Email:</strong> ${loginEmail}</p>
      <p style="margin: 0; font-size: 14px; color: #33415C;"><strong>Password:</strong> ${password}</p>
    </div>
    ${
      customMessage
        ? `<p style="margin: 0 0 16px; line-height: 1.5; color: #33415C; white-space: pre-wrap;">${customMessage}</p>`
        : ""
    }
    <a href="${loginUrl}"
       style="display: inline-block; background: #12203D; color: #FAF9F6; text-decoration: none; padding: 12px 20px; border-radius: 4px; font-weight: 600;">
      Sign in
    </a>
    <p style="margin: 24px 0 0; font-size: 13px; color: #6B7280; line-height: 1.5;">
      For your security, please sign in and change this password as soon as possible.
    </p>
  </div>`;

  return getResendClient().emails.send({
    from: FROM,
    to,
    subject: "🎓 Welcome to HiG EDUCAMPUS!",
    html,
  });
}
