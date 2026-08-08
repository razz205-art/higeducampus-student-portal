import { prisma } from "@/lib/db/prisma";
import { getSubjectProgress } from "@/lib/data/progress";
import { formatISODate } from "@/lib/utils/date";
import type {
  CompletedCourseItem,
  CertificateItem,
  CertificateVerification,
} from "@/types/certificate";

export async function getCompletedCourses(studentId: string): Promise<CompletedCourseItem[]> {
  const subjectProgress = await getSubjectProgress(studentId);
  const completed = subjectProgress.filter((c) => c.progressPercent === 100);
  if (completed.length === 0) return [];

  const courseIds = completed.map((c) => c.id);
  const certificates = await prisma.certificate.findMany({
    where: { studentId, courseId: { in: courseIds } },
    select: { id: true, courseId: true },
  });
  const certByCourse = new Map<string, string>(
    certificates.map((c: { courseId: string; id: string }) => [c.courseId, c.id])
  );

  return completed.map((c) => ({
    id: c.id,
    courseId: c.id,
    courseCode: c.courseCode,
    courseName: c.courseName,
    progressPercent: c.progressPercent,
    hasCertificate: certByCourse.has(c.id),
    certificateId: certByCourse.get(c.id) ?? null,
  }));
}

export async function getStudentCertificates(studentId: string): Promise<CertificateItem[]> {
  const certificates = await prisma.certificate.findMany({
    where: { studentId },
    orderBy: { issuedAt: "desc" },
  });

  return certificates.map(
    (c: {
      id: string;
      certificateNumber: string;
      verificationCode: string;
      studentName: string;
      courseCode: string;
      courseName: string;
      issuedAt: Date;
    }) => ({
      id: c.id,
      certificateNumber: c.certificateNumber,
      verificationCode: c.verificationCode,
      studentName: c.studentName,
      courseCode: c.courseCode,
      courseName: c.courseName,
      issuedAt: formatISODate(c.issuedAt),
    })
  );
}

/** Public lookup by the code embedded in the QR / verification URL — no auth. */
export async function getCertificateByVerificationCode(
  code: string
): Promise<CertificateVerification> {
  const cert = await prisma.certificate.findUnique({ where: { verificationCode: code } });
  if (!cert) return { valid: false };

  return {
    valid: true,
    certificateNumber: cert.certificateNumber,
    studentName: cert.studentName,
    courseCode: cert.courseCode,
    courseName: cert.courseName,
    issuedAt: formatISODate(cert.issuedAt),
  };
}

/** Full record for PDF generation. Returns null if not found or not owned by studentId. */
export async function getCertificateForDownload(certificateId: string, studentId: string) {
  const cert = await prisma.certificate.findUnique({ where: { id: certificateId } });
  if (!cert || cert.studentId !== studentId) return null;
  return cert;
}
