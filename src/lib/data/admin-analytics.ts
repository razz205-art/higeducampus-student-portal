import { prisma } from "@/lib/db/prisma";
import {
  toDateOnlyUTC,
  addMonthsUTC,
  daysInMonth,
  formatMonthLabel,
  todayUTC,
} from "@/lib/utils/date";
import type { AttendanceTrendPoint } from "@/types/attendance";

export interface AdminAnalyticsOverview {
  totalStudents: number;
  totalFaculty: number;
  totalCourses: number;
  avgAttendancePercent: number;
  certificatesIssued: number;
  avgSemesterPercent: number;
}

export async function getAdminAnalyticsOverview(): Promise<AdminAnalyticsOverview> {
  const [
    totalStudents,
    totalFaculty,
    totalCourses,
    attendanceRecords,
    certificatesIssued,
    semesterResults,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "FACULTY" } }),
    prisma.course.count(),
    prisma.attendanceRecord.findMany({ select: { status: true } }),
    prisma.certificate.count({ where: { isRevoked: false } }),
    prisma.semesterResult.findMany({ select: { percentage: true } }),
  ]);

  const presentCount = attendanceRecords.filter(
    (r: { status: string }) => r.status === "PRESENT"
  ).length;
  const avgAttendancePercent =
    attendanceRecords.length > 0
      ? Math.round((presentCount / attendanceRecords.length) * 1000) / 10
      : 0;

  const avgSemesterPercent =
    semesterResults.length > 0
      ? Math.round(
          (semesterResults.reduce(
            (sum: number, r: { percentage: number }) => sum + r.percentage,
            0
          ) /
            semesterResults.length) *
            10
        ) / 10
      : 0;

  return {
    totalStudents,
    totalFaculty,
    totalCourses,
    avgAttendancePercent,
    certificatesIssued,
    avgSemesterPercent,
  };
}

/**
 * Institution-wide monthly attendance %, same shape as the per-student
 * trend already built for Attendance — reuses AttendanceTrendChart as-is.
 */
export async function getInstitutionAttendanceTrend(
  monthsBack = 6
): Promise<AttendanceTrendPoint[]> {
  const now = todayUTC();
  const points: AttendanceTrendPoint[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const monthDate = addMonthsUTC(toDateOnlyUTC(now.getUTCFullYear(), now.getUTCMonth(), 1), -i);
    const year = monthDate.getUTCFullYear();
    const monthIndex = monthDate.getUTCMonth();
    const start = toDateOnlyUTC(year, monthIndex, 1);
    const end = toDateOnlyUTC(year, monthIndex, daysInMonth(year, monthIndex));

    const records = await prisma.attendanceRecord.findMany({
      where: { date: { gte: start, lte: end } },
      select: { status: true },
    });

    const total = records.length;
    const present = records.filter((r: { status: string }) => r.status === "PRESENT").length;
    const percentage = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

    points.push({ month: formatMonthLabel(monthDate), percentage });
  }

  return points;
}

export interface BatchEnrollmentPoint {
  batchName: string;
  studentCount: number;
}

export async function getEnrollmentByBatch(): Promise<BatchEnrollmentPoint[]> {
  const batches = await prisma.batch.findMany({
    select: { name: true, _count: { select: { students: true } } },
    orderBy: { name: "asc" },
  });
  return batches.map((b: { name: string; _count: { students: number } }) => ({
    batchName: b.name,
    studentCount: b._count.students,
  }));
}
