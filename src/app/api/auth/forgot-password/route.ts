import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { generateResetToken, RESET_TOKEN_TTL_MINUTES } from "@/lib/security/tokens";
import { sendPasswordResetEmail } from "@/lib/email/resend";
import { rateLimit } from "@/lib/security/rate-limit";

const GENERIC_RESPONSE = {
  message: "If an account exists for that email, a reset link has been sent.",
};

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  // Rate limit by IP AND by email to blunt both spray attacks and targeted
  // enumeration against a single account.
  const ipLimit = rateLimit(`forgot-pw-ip:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!ipLimit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    // Still return the generic response shape to avoid leaking validation
    // details that could assist enumeration.
    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
  }
  const { email } = parsed.data;

  const emailLimit = rateLimit(`forgot-pw-email:${email}`, {
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!emailLimit.success) {
    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond identically whether or not the user exists, and whether
  // they signed up via Google (no password to reset) — this is the single
  // most important anti-enumeration control on this endpoint.
  if (user && user.passwordHash && user.isActive) {
    const { raw, hash } = generateResetToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { tokenHash: hash, userId: user.id, expiresAt, requestIp: ip },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${raw}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    await prisma.auditLog.create({
      data: { userId: user.id, event: "PASSWORD_RESET_REQUESTED", ipAddress: ip },
    });
  }

  return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
}
