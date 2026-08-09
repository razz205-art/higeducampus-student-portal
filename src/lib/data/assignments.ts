import { prisma } from "@/lib/db/prisma";
import { getStudentCourses } from "@/lib/data/attendance";
import { formatISODate } from "@/lib/utils/date";

export interface StudentAssignmentItem {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  title: string;
  instructions: string | null;
  dueDate: string;
  maxScore: number;
  attachmentUrl: string | null;
  attachmentType: "DOCUMENT" | "VIDEO" | "LINK" | null;
  submission: {
    submissionUrl: string | null;
    submissionNote: string | null;
    submittedAt: string;
    status: "SUBMITTED" | "GRADED";
    score: number | null;
  } | null;
}

export async function getStudentAssignments(studentId: string): Promise<StudentAssignmentItem[]> {
  const courses = await getStudentCourses(studentId);
  const courseIds = courses.map((c) => c.id);
  if (courseIds.length === 0) return [];

  const assignments = await prisma.assignment.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      course: { select: { code: true, name: true } },
      submissions: {
        where: { studentId },
        select: {
          submissionUrl: true,
          submissionNote: true,
          submittedAt: true,
          status: true,
          score: true,
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return assignments.map(
    (a: {
      id: string;
      courseId: string;
      title: string;
      instructions: string | null;
      dueDate: Date;
      maxScore: number;
      attachmentUrl: string | null;
      attachmentType: "DOCUMENT" | "VIDEO" | "LINK" | null;
      course: { code: string; name: string };
      submissions: {
        submissionUrl: string | null;
        submissionNote: string | null;
        submittedAt: Date;
        status: "SUBMITTED" | "GRADED";
        score: number | null;
      }[];
    }) => {
      const sub = a.submissions[0];
      return {
        id: a.id,
        courseId: a.courseId,
        courseCode: a.course.code,
        courseName: a.course.name,
        title: a.title,
        instructions: a.instructions,
        dueDate: formatISODate(a.dueDate),
        maxScore: a.maxScore,
        attachmentUrl: a.attachmentUrl,
        attachmentType: a.attachmentType,
        submission: sub
          ? {
              submissionUrl: sub.submissionUrl,
              submissionNote: sub.submissionNote,
              submittedAt: formatISODate(sub.submittedAt),
              status: sub.status,
              score: sub.score,
            }
          : null,
      };
    }
  );
}
