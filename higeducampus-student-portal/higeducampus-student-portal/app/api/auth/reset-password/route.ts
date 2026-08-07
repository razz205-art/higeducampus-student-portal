import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { hashToken } from "@/lib/tokens";
import { hashPassword } from "@/lib/password";
import { sendPasswordChangedNotice } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = rateLimit(`reset-pw:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  const { token, password } = parsed.data;

  const tokenHash = hashToken(token);
  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  const isValid =
    resetRecord &&
    !resetRecord.usedAt &&
    resetRecord.expiresAt > new Date() &&
    resetRecord.user.isActive;

  if (!isValid) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Please request a new one." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: {
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    }),
    // Single-use enforcement.
    prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate any other outstanding reset tokens for this user.
    prisma.passwordResetToken.updateMany({
      where: { userId: resetRecord.userId, usedAt: null, id: { not: resetRecord.id } },
      data: { usedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        userId: resetRecord.userId,
        event: "PASSWORD_RESET_COMPLETED",
        ipAddress: ip,
      },
    }),
  ]);

  await sendPasswordChangedNotice(resetRecord.user.email);

  return NextResponse.json({ message: "Your password has been reset. You can now log in." });
}
