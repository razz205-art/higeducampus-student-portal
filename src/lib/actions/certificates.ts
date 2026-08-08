"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { getSubjectProgress } from "@/lib/data/progress";

export interface IssueCertificateResult {
  success: boolean;
  message: string;
  certificateId?: string;
}

/**
 * Idempotent: if a certificate already exists for this student+course, it
 * is returned as-is rather than erroring or duplicating.
 */
export async function issueCertificateAction(courseId: string): Promise<IssueCertificateResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (session.user.role !== "STUDENT") {
    return { success: false, message: "Only students can issue their own certificates." };
  }

  const existing = await prisma.certificate.findUnique({
    where: { studentId_courseId: { studentId: session.user.id, courseId } },
  });
  if (existing) {
    return { success: true, message: "Certificate already issued.", certificateId: existing.id };
  }

  // Re-verify completion server-side — never trust the client's claim.
  const subjectProgress = await getSubjectProgress(session.user.id);
  const course = subjectProgress.find((c) => c.id === courseId);
  if (!course || course.progressPercent < 100) {
    return { success: false, message: "This course isn't fully completed yet." };
  }

  const student = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  const certificateCount = await prisma.certificate.count();
  const certificateNumber = `HEC-${new Date().getFullYear()}-${String(certificateCount + 1).padStart(5, "0")}`;
  const verificationCode = randomBytes(16).toString("hex");

  const certificate = await prisma.certificate.create({
    data: {
      studentId: session.user.id,
      courseId,
      certificateNumber,
      verificationCode,
      studentName: student?.name ?? student?.email ?? "Student",
      courseName: course.courseName,
      courseCode: course.courseCode,
    },
  });

  revalidatePath("/student/certificates");

  return { success: true, message: "Certificate issued.", certificateId: certificate.id };
}

function isAdmin(role: string | undefined): boolean {
  return role === "ACADEMIC_ADMIN" || role === "SUPER_ADMIN";
}

export async function revokeCertificateAction(
  certificateId: string
): Promise<IssueCertificateResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to revoke certificates." };
  }

  try {
    await prisma.certificate.update({
      where: { id: certificateId },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  } catch {
    return { success: false, message: "Certificate not found." };
  }

  revalidatePath("/academic-admin/certificates");
  revalidatePath("/student/certificates");

  return { success: true, message: "Certificate revoked." };
}

export async function restoreCertificateAction(
  certificateId: string
): Promise<IssueCertificateResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to restore certificates." };
  }

  try {
    await prisma.certificate.update({
      where: { id: certificateId },
      data: { isRevoked: false, revokedAt: null },
    });
  } catch {
    return { success: false, message: "Certificate not found." };
  }

  revalidatePath("/academic-admin/certificates");
  revalidatePath("/student/certificates");

  return { success: true, message: "Certificate restored." };
}
