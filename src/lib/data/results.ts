import { prisma } from "@/lib/db/prisma";
import { getStudentCourses } from "@/lib/data/attendance";
import { formatISODate } from "@/lib/utils/date";
import type { QuizPerformanceRow } from "@/types/progress";
import type {
  SemesterResultItem,
  BatchRankInfo,
  ResultsPerformancePoint,
  AssignmentResultRow,
} from "@/types/results";
import type { AssessmentKind } from "@prisma/client";

interface RawAttempt {
  id: string;
  score: number;
  takenAt: Date;
  quiz: { title: string; maxScore: number; course: { code: string; name: string } };
}

function toQuizRow(a: RawAttempt): QuizPerformanceRow {
  return {
    id: a.id,
    quizTitle: a.quiz.title,
    courseCode: a.quiz.course.code,
    courseName: a.quiz.course.name,
    score: a.score,
    maxScore: a.quiz.maxScore,
    percentage: a.quiz.maxScore > 0 ? Math.round((a.score / a.quiz.maxScore) * 100) : 0,
    takenAt: formatISODate(a.takenAt),
  };
}

async function getQuizResultsByKind(
  studentId: string,
  kind: AssessmentKind,
  limit = 20
): Promise<QuizPerformanceRow[]> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { studentId, quiz: { kind } },
    include: { quiz: { include: { course: { select: { code: true, name: true } } } } },
    orderBy: { takenAt: "desc" },
    take: limit,
  });
  return attempts.map(toQuizRow);
}

export async function getInternalResults(
  studentId: string,
  limit = 20
): Promise<QuizPerformanceRow[]> {
  return getQuizResultsByKind(studentId, "INTERNAL", limit);
}

export async function getMockTestResults(
  studentId: string,
  limit = 20
): Promise<QuizPerformanceRow[]> {
  return getQuizResultsByKind(studentId, "MOCK_TEST", limit);
}

export async function getAssignmentResults(studentId: string): Promise<AssignmentResultRow[]> {
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { studentId },
    include: {
      assignment: {
        select: { title: true, maxScore: true, course: { select: { code: true, name: true } } },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return submissions.map(
    (s: {
      id: string;
      status: "SUBMITTED" | "GRADED";
      score: number | null;
      submittedAt: Date;
      assignment: {
        title: string;
        maxScore: number;
        course: { code: string; name: string };
      };
    }) => ({
      id: s.id,
      title: s.assignment.title,
      courseCode: s.assignment.course.code,
      courseName: s.assignment.course.name,
      status: s.status,
      score: s.score,
      maxScore: s.assignment.maxScore,
      submittedAt: formatISODate(s.submittedAt),
    })
  );
}

export async function getSemesterResults(studentId: string): Promise<SemesterResultItem[]> {
  const results = await prisma.semesterResult.findMany({
    where: { studentId },
    include: { courseResults: { include: { course: { select: { code: true, name: true } } } } },
    orderBy: { publishedAt: "desc" },
  });

  return results.map(
    (r: {
      id: string;
      semesterLabel: string;
      gpa: number;
      percentage: number;
      status: string;
      publishedAt: Date;
      courseResults: {
        id: string;
        marksObtained: number;
        maxMarks: number;
        grade: string;
        course: { code: string; name: string };
      }[];
    }) => ({
      id: r.id,
      semesterLabel: r.semesterLabel,
      gpa: r.gpa,
      percentage: r.percentage,
      status: r.status as SemesterResultItem["status"],
      publishedAt: formatISODate(r.publishedAt),
      courseResults: r.courseResults.map((c) => ({
        id: c.id,
        courseCode: c.course.code,
        courseName: c.course.name,
        marksObtained: c.marksObtained,
        maxMarks: c.maxMarks,
        grade: c.grade,
      })),
    })
  );
}

/**
 * Rank among the student's own batch, based on each student's most
 * recently published SemesterResult percentage. Returns null if the
 * student has no batch or no published result yet.
 */
export async function getBatchRank(studentId: string): Promise<BatchRankInfo | null> {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { batchId: true, batch: { select: { name: true } } },
  });
  if (!student?.batchId) return null;

  const batchmates = await prisma.user.findMany({
    where: { batchId: student.batchId, role: "STUDENT" },
    select: {
      id: true,
      semesterResults: {
        orderBy: { publishedAt: "desc" },
        take: 1,
        select: { percentage: true },
      },
    },
  });

  const ranked = batchmates
    .map((u: { id: string; semesterResults: { percentage: number }[] }) => ({
      id: u.id,
      percentage: u.semesterResults[0]?.percentage,
    }))
    .filter((u: { id: string; percentage: number | undefined }) => u.percentage !== undefined)
    .sort(
      (a: { percentage?: number }, b: { percentage?: number }) => b.percentage! - a.percentage!
    );

  const position = ranked.findIndex((u: { id: string }) => u.id === studentId);
  if (position === -1) return null;

  const totalStudents = ranked.length;
  const rank = position + 1;
  const percentile =
    totalStudents > 1 ? Math.round(((totalStudents - rank) / (totalStudents - 1)) * 100) : 100;

  return { rank, totalStudents, percentile, batchName: student.batch?.name ?? "" };
}

/**
 * Merges two score sources into one chronological trend: quiz attempts
 * taken inside the platform, and externally-graded Test Report entries
 * (uploaded via the admin's Test Reports feature). Both are normalized to
 * the same {label, date, percentage} shape so the existing chart component
 * doesn't need to know which source a point came from. Sorted oldest to
 * newest, then only the most recent `limit` points are kept — across both
 * sources combined, not `limit` of each separately.
 */
export async function getResultsPerformanceTrend(
  studentId: string,
  limit = 12
): Promise<ResultsPerformancePoint[]> {
  const [attempts, testEntries] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { studentId },
      include: { quiz: { select: { title: true, maxScore: true } } },
      orderBy: { takenAt: "asc" },
    }),
    prisma.testReportEntry.findMany({
      where: { studentId },
      include: { testReport: { select: { title: true, createdAt: true } } },
      orderBy: { testReport: { createdAt: "asc" } },
    }),
  ]);

  const quizPoints = attempts.map(
    (a: { quiz: { title: string; maxScore: number }; score: number; takenAt: Date }) => ({
      label: a.quiz.title,
      date: formatISODate(a.takenAt),
      percentage: a.quiz.maxScore > 0 ? Math.round((a.score / a.quiz.maxScore) * 100) : 0,
      sortKey: a.takenAt.getTime(),
    })
  );

  const testReportPoints = testEntries.map(
    (e: { percentage: number; testReport: { title: string; createdAt: Date } }) => ({
      label: e.testReport.title,
      date: formatISODate(e.testReport.createdAt),
      percentage: Math.round(e.percentage),
      sortKey: e.testReport.createdAt.getTime(),
    })
  );

  return [...quizPoints, ...testReportPoints]
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(-limit)
    .map(({ label, date, percentage }) => ({ label, date, percentage }));
}

export async function hasAnyCourses(studentId: string): Promise<boolean> {
  const courses = await getStudentCourses(studentId);
  return courses.length > 0;
}
