import { prisma } from "@/lib/db/prisma";

export interface AdminSemesterResultRow {
  id: string;
  studentId: string;
  studentName: string;
  semesterLabel: string;
  gpa: number;
  percentage: number;
  status: string;
  publishedAt: string;
}

export async function getAllSemesterResultsForAdmin(): Promise<AdminSemesterResultRow[]> {
  const results = await prisma.semesterResult.findMany({
    include: { student: { select: { name: true, email: true } } },
    orderBy: { publishedAt: "desc" },
  });

  return results.map(
    (r: {
      id: string;
      studentId: string;
      semesterLabel: string;
      gpa: number;
      percentage: number;
      status: string;
      publishedAt: Date;
      student: { name: string | null; email: string };
    }) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.student.name ?? r.student.email,
      semesterLabel: r.semesterLabel,
      gpa: r.gpa,
      percentage: r.percentage,
      status: r.status,
      publishedAt: r.publishedAt.toISOString().slice(0, 10),
    })
  );
}

export interface StudentOption {
  id: string;
  name: string;
}

export async function getStudentOptions(): Promise<StudentOption[]> {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  return students.map((s: { id: string; name: string | null; email: string }) => ({
    id: s.id,
    name: s.name ?? s.email,
  }));
}
