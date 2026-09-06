import { prisma } from "@/lib/db/prisma";
import { formatISODate } from "@/lib/utils/date";
import type {
  TestReportSummary,
  TestReportDetail,
  TestReportEntryRow,
  StudentTestReportRow,
  ScoreDistributionBucket,
} from "@/types/test-reports";

function toEntryRow(e: {
  id: string;
  rank: number;
  name: string;
  percentage: number;
  correct: number | null;
  incorrect: number | null;
  timeRaw: string | null;
  status: string;
  studentId: string | null;
  student: { name: string | null; email: string } | null;
}): TestReportEntryRow {
  return {
    id: e.id,
    rank: e.rank,
    name: e.name,
    percentage: e.percentage,
    correct: e.correct,
    incorrect: e.incorrect,
    timeRaw: e.timeRaw,
    status: e.status as TestReportEntryRow["status"],
    studentId: e.studentId,
    studentName: e.student ? (e.student.name ?? e.student.email) : null,
  };
}

export async function getTestReportsForAdmin(): Promise<TestReportSummary[]> {
  const reports = await prisma.testReport.findMany({
    include: {
      entries: { select: { percentage: true, status: true } },
      course: { select: { code: true, name: true } },
      batch: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return reports.map((r: (typeof reports)[number]) => {
    const total = r.entries.length;
    const avg =
      total > 0
        ? r.entries.reduce((sum: number, e: (typeof r.entries)[number]) => sum + e.percentage, 0) /
          total
        : 0;
    const passCount = r.entries.filter((e: (typeof r.entries)[number]) => e.status === "PASS")
      .length;
    return {
      id: r.id,
      title: r.title,
      createdAt: formatISODate(r.createdAt),
      passingPercentage: r.passingPercentage,
      courseId: r.courseId,
      courseCode: r.course.code,
      courseName: r.course.name,
      batchId: r.batchId,
      batchName: r.batch.name,
      totalStudents: total,
      averagePercentage: Math.round(avg * 10) / 10,
      passRate: total > 0 ? Math.round((passCount / total) * 1000) / 10 : 0,
    };
  });
}

const DISTRIBUTION_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "90-100%", min: 90, max: 100 },
  { label: "80-89%", min: 80, max: 89.999 },
  { label: "70-79%", min: 70, max: 79.999 },
  { label: "60-69%", min: 60, max: 69.999 },
  { label: "50-59%", min: 50, max: 59.999 },
  { label: "40-49%", min: 40, max: 49.999 },
  { label: "30-39%", min: 30, max: 39.999 },
  { label: "20-29%", min: 20, max: 29.999 },
  { label: "10-19%", min: 10, max: 19.999 },
  { label: "0-9%", min: 0, max: 9.999 },
];

export async function getTestReportDetail(id: string): Promise<TestReportDetail | null> {
  const report = await prisma.testReport.findUnique({
    where: { id },
    include: {
      entries: {
        include: { student: { select: { name: true, email: true } } },
        orderBy: { rank: "asc" },
      },
      course: { select: { code: true, name: true } },
      batch: { select: { name: true } },
    },
  });
  if (!report) return null;

  const entries: TestReportEntryRow[] = report.entries.map(toEntryRow);
  const total = entries.length;
  const avg =
    total > 0
      ? entries.reduce((sum: number, e: TestReportEntryRow) => sum + e.percentage, 0) / total
      : 0;
  const passCount = entries.filter((e: TestReportEntryRow) => e.status === "PASS").length;
  const highest =
    total > 0 ? Math.max(...entries.map((e: TestReportEntryRow) => e.percentage)) : 0;

  const distribution: ScoreDistributionBucket[] = DISTRIBUTION_BUCKETS.map((b) => ({
    label: b.label,
    count: entries.filter(
      (e: TestReportEntryRow) => e.percentage >= b.min && e.percentage <= b.max
    ).length,
  })).filter((b) => b.count > 0);

  return {
    id: report.id,
    title: report.title,
    createdAt: formatISODate(report.createdAt),
    passingPercentage: report.passingPercentage,
    courseId: report.courseId,
    courseCode: report.course.code,
    courseName: report.course.name,
    batchId: report.batchId,
    batchName: report.batch.name,
    totalStudents: total,
    averagePercentage: Math.round(avg * 10) / 10,
    passRate: total > 0 ? Math.round((passCount / total) * 1000) / 10 : 0,
    highestPercentage: highest,
    entries,
    topPerformers: entries.slice(0, 5),
    scoreDistribution: distribution,
  };
}

export async function deleteTestReportById(id: string): Promise<void> {
  await prisma.testReport.delete({ where: { id } });
}

/**
 * Full rankings (every student, not just the requesting one) for every test
 * report a given student has an entry in. Used for the student-facing
 * "Overall Rankings" section so students can see how their score compares
 * to the rest of their batch — access is implicitly scoped to tests the
 * student actually appears in, since the id list comes from their own
 * TestReportEntry rows.
 */
export async function getOverallTestReportsForStudent(
  studentId: string
): Promise<TestReportDetail[]> {
  const reportIds = await prisma.testReportEntry.findMany({
    where: { studentId },
    select: { testReportId: true },
    distinct: ["testReportId"],
  });
  if (reportIds.length === 0) return [];

  const details = await Promise.all(
    reportIds.map((r: { testReportId: string }) => getTestReportDetail(r.testReportId))
  );

  return (details.filter(Boolean) as TestReportDetail[]).sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1
  );
}

/** A student's own results across every test report they appear in — never includes other students' data. */
export async function getStudentTestReports(studentId: string): Promise<StudentTestReportRow[]> {
  const entries = await prisma.testReportEntry.findMany({
    where: { studentId },
    include: {
      testReport: {
        select: {
          id: true,
          title: true,
          createdAt: true,
          _count: { select: { entries: true } },
        },
      },
    },
    orderBy: { testReport: { createdAt: "desc" } },
  });

  return entries.map((e: (typeof entries)[number]) => ({
    testReportId: e.testReport.id,
    title: e.testReport.title,
    createdAt: formatISODate(e.testReport.createdAt),
    rank: e.rank,
    totalStudents: e.testReport._count.entries,
    percentage: e.percentage,
    correct: e.correct,
    incorrect: e.incorrect,
    timeRaw: e.timeRaw,
    status: e.status as StudentTestReportRow["status"],
  }));
}
