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
  sessionMaxAgeSeconds: 8 * 60 * 60, // 8 hours
  sessionUpdateAgeSeconds: 60 * 60, // refresh token every hour of activity
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
