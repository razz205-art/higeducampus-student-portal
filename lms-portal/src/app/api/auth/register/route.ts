import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/security/password";
import { registerSchema } from "@/lib/validations/auth";
import { rateLimit } from "@/lib/security/rate-limit";
import { Role } from "@prisma/client";

/**
 * Public self-registration is intentionally limited to the STUDENT role.
 * Faculty, Academic Admin, and Super Admin accounts must be provisioned by
 * an existing admin — never through an open signup form. This prevents
 * privilege escalation via a public endpoint.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = rateLimit(`register:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const allowedDomain = process.env.ALLOWED_STUDENT_EMAIL_DOMAIN;
  if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
    return NextResponse.json(
      { error: `Registration is restricted to @${allowedDomain} email addresses.` },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Generic message: don't confirm which emails are already registered.
    return NextResponse.json(
      { message: "If that email can be registered, you'll receive further instructions." },
      { status: 200 }
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: { name, email, passwordHash, role: Role.STUDENT },
  });

  await prisma.auditLog.create({
    data: { event: "USER_REGISTERED", metadata: { email, role: "STUDENT" } },
  });

  return NextResponse.json({ message: "Account created. You can now log in." }, { status: 201 });
}
