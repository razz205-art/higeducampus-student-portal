/**
 * Centralized, non-secret application configuration. Secrets stay in
 * environment variables (see .env.example) and are read directly where
 * needed — never re-exported from here.
 */
export const siteConfig = {
  name: "LMS Portal",
  description: "Enterprise learning management system.",
};

export const authConfigConstants = {
  // 30 days, refreshed on activity (updateAge), so someone who uses the
  // portal at least once a month stays signed in indefinitely — closing
  // the browser no longer logs them out, only an explicit "Log out" does.
  sessionMaxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
  sessionUpdateAgeSeconds: 24 * 60 * 60, // refresh the 30-day window once a day of activity
  maxFailedLoginAttempts: 5,
  accountLockDurationMs: 15 * 60 * 1000, // 15 minutes
  passwordResetTokenTtlMinutes: 30,
};

export const routes = {
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  unauthorized: "/unauthorized",
} as const;
