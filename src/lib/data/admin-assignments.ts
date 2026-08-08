import { prisma } from "@/lib/db/prisma";

export interface AdminAssignmentRow {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  title: string;
  dueDate: string;
  maxScore: number;
  submissionCount: number;
}

export async function getAllAssignmentsForAdmin(): Promise<AdminAssignmentRow[]> {
  const assignments = await prisma.assignment.findMany({
    include: {
      course: { select: { code: true, name: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { dueDate: "desc" },
  });

  return assignments.map(
    (a: {
      id: string;
      courseId: string;
      title: string;
      dueDate: Date;
      maxScore: number;
      course: { code: string; name: string };
      _count: { submissions: number };
    }) => ({
      id: a.id,
      courseId: a.courseId,
      courseCode: a.course.code,
      courseName: a.course.name,
      title: a.title,
      dueDate: a.dueDate.toISOString().slice(0, 10),
      maxScore: a.maxScore,
      submissionCount: a._count.submissions,
    })
  );
}
