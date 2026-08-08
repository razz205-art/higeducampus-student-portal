import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  getInternalResults,
  getMockTestResults,
  getAssignmentResults,
  getSemesterResults,
} from "@/lib/data/results";
import { buildReportResponse, parseFormat } from "@/lib/utils/report-export";
import { formatISODate } from "@/lib/utils/date";

/**
 * Downloads the signed-in STUDENT's own results as a single combined
 * report. Reuses the same CSV/Excel/PDF builder as the Attendance module
 * rather than a parallel implementation. ?format=csv|xlsx|pdf.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (session.user.role !== "STUDENT" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const format = parseFormat(req.nextUrl.searchParams.get("format"));
  const studentId = session.user.id;

  const [internal, mock, assignments, semesters] = await Promise.all([
    getInternalResults(studentId, 50),
    getMockTestResults(studentId, 50),
    getAssignmentResults(studentId),
    getSemesterResults(studentId),
  ]);

  const headers = ["Category", "Title", "Course", "Score", "Date"];
  const rows: (string | number)[][] = [
    ...internal.map((r) => [
      "Internal Result",
      r.quizTitle,
      r.courseCode,
      `${r.score}/${r.maxScore} (${r.percentage}%)`,
      r.takenAt,
    ]),
    ...mock.map((r) => [
      "Mock Test",
      r.quizTitle,
      r.courseCode,
      `${r.score}/${r.maxScore} (${r.percentage}%)`,
      r.takenAt,
    ]),
    ...assignments.map((r) => [
      "Assignment",
      r.title,
      r.courseCode,
      r.score !== null ? `${r.score}/${r.maxScore}` : "Submitted",
      r.submittedAt,
    ]),
    ...semesters.map((r) => [
      "Semester Result",
      r.semesterLabel,
      "—",
      `GPA ${r.gpa.toFixed(2)} · ${r.percentage.toFixed(1)}% · ${r.status}`,
      r.publishedAt,
    ]),
  ];

  const filenameBase = `results-report-${formatISODate(new Date())}`;

  return buildReportResponse("Results Report", headers, rows, format, filenameBase);
}
