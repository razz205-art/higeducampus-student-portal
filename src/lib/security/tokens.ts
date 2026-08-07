import { randomBytes, createHash } from "crypto";
import { authConfigConstants } from "@/config/site";

/**
 * Generates a cryptographically secure raw token (sent to the user via
 * email) and its SHA-256 hash (the only thing persisted in the database).
 * Never store the verifiable secret in plaintext, so a DB leak alone cannot
 * be used to reset accounts.
 */
export function generateResetToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export const RESET_TOKEN_TTL_MINUTES = authConfigConstants.passwordResetTokenTtlMinutes;
