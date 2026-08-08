import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  getAdminAnalyticsOverview,
  getCourseCompletionRates,
  getAssignmentCompletionRates,
  getFacultyPerformance,
} from "@/lib/data/admin-analytics";
import { buildReportResponse, parseFormat } from "@/lib/utils/report-export";
import { formatISODate } from "@/lib/utils/date";

function isAdmin(role: string | undefined): boolean {
  return role === "ACADEMIC_ADMIN" || role === "SUPER_ADMIN";
}

/**
 * Downloads a combined analytics report. Reuses the same CSV/Excel/PDF
 * builder as Attendance and Results — no parallel export implementation.
 * ?format=csv|xlsx|pdf.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const format = parseFormat(req.nextUrl.searchParams.get("format"));

  const [overview, courseCompletion, assignmentCompletion, facultyPerformance] = await Promise.all([
    getAdminAnalyticsOverview(),
    getCourseCompletionRates(),
    getAssignmentCompletionRates(),
    getFacultyPerformance(),
  ]);

  const headers = ["Category", "Name", "Metric", "Value"];
  const rows: (string | number)[][] = [
    ["Overview", "Total Students", "Count", overview.totalStudents],
    ["Overview", "Total Faculty", "Count", overview.totalFaculty],
    ["Overview", "Total Courses", "Count", overview.totalCourses],
    ["Overview", "Avg. Attendance", "Percent", `${overview.avgAttendancePercent}%`],
    ["Overview", "Avg. Semester Score", "Percent", `${overview.avgSemesterPercent}%`],
    ["Overview", "Certificates Issued", "Count", overview.certificatesIssued],
    ...courseCompletion.map((c) => [
      "Course Completion",
      `${c.courseCode} — ${c.courseName}`,
      "Completion Rate",
      `${c.completedCount}/${c.enrolledCount} (${c.completionPercent}%)`,
    ]),
    ...assignmentCompletion.map((a) => [
      "Assignment Completion",
      `${a.courseCode} — ${a.courseName}`,
      "Submission Rate",
      `${a.actualSubmissions}/${a.possibleSubmissions} (${a.completionPercent}%)`,
    ]),
    ...facultyPerformance.map((f) => [
      "Faculty Performance",
      f.facultyName,
      "Courses / Students / Avg. Attendance / Avg. Result",
      `${f.courseCount} / ${f.studentCount} / ${f.avgAttendancePercent}% / ${f.avgResultPercent}%`,
    ]),
  ];

  const filenameBase = `analytics-report-${formatISODate(new Date())}`;

  return buildReportResponse("Analytics Report", headers, rows, format, filenameBase);
}
