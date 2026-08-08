import { prisma } from "@/lib/db/prisma";
import {
  toDateOnlyUTC,
  addMonthsUTC,
  addDaysUTC,
  daysInMonth,
  formatMonthLabel,
  formatISODate,
  todayUTC,
} from "@/lib/utils/date";
import type { AttendanceTrendPoint } from "@/types/attendance";
import type { ActivityPoint } from "@/types/progress";
import type {
  CourseCompletionRow,
  AssignmentCompletionRow,
  FacultyPerformanceRow,
} from "@/types/analytics";

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
  const monthDates = Array.from({ length: monthsBack }, (_, idx) => {
    const i = monthsBack - 1 - idx;
    return addMonthsUTC(toDateOnlyUTC(now.getUTCFullYear(), now.getUTCMonth(), 1), -i);
  });

  // Independent per-month queries — run concurrently instead of one
  // sequential round-trip per month.
  const points = await Promise.all(
    monthDates.map(async (monthDate) => {
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

      return { month: formatMonthLabel(monthDate), percentage };
    })
  );

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

/** New student sign-ups per month — same {label, count} shape as the
 * ActivityChart already built for Progress Tracker, reused as-is. */
export async function getStudentGrowth(monthsBack = 6): Promise<ActivityPoint[]> {
  const now = todayUTC();
  const monthDates = Array.from({ length: monthsBack }, (_, idx) => {
    const i = monthsBack - 1 - idx;
    return addMonthsUTC(toDateOnlyUTC(now.getUTCFullYear(), now.getUTCMonth(), 1), -i);
  });

  const points = await Promise.all(
    monthDates.map(async (monthDate) => {
      const year = monthDate.getUTCFullYear();
      const monthIndex = monthDate.getUTCMonth();
      const start = toDateOnlyUTC(year, monthIndex, 1);
      const end = toDateOnlyUTC(year, monthIndex, daysInMonth(year, monthIndex));
      // Month boundaries here are date-only, but User.createdAt is a full
      // timestamp — extend the end bound to the start of the next day so
      // the last day of the month isn't cut off by its own midnight.
      const endExclusive = addDaysUTC(end, 1);

      const count = await prisma.user.count({
        where: { role: "STUDENT", createdAt: { gte: start, lt: endExclusive } },
      });

      return { label: formatMonthLabel(monthDate), count };
    })
  );

  return points;
}

/** Per-course completion rate: % of enrolled students at 100% lesson completion. */
export async function getCourseCompletionRates(): Promise<CourseCompletionRow[]> {
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      enrollments: { select: { studentId: true } },
      modules: { select: { lessons: { select: { id: true } } } },
    },
  });

  const rows: CourseCompletionRow[] = [];
  for (const course of courses) {
    const lessonIds = course.modules.flatMap((m: { lessons: { id: string }[] }) =>
      m.lessons.map((l) => l.id)
    );
    const enrolledCount = course.enrollments.length;

    if (lessonIds.length === 0 || enrolledCount === 0) {
      rows.push({
        courseId: course.id,
        courseCode: course.code,
        courseName: course.name,
        enrolledCount,
        completedCount: 0,
        completionPercent: 0,
      });
      continue;
    }

    let completedCount = 0;
    const studentIds = course.enrollments.map((e: { studentId: string }) => e.studentId);
    // Single query for every enrolled student's completions in this course,
    // instead of one query per student (was N+1: 500 students would mean
    // 500 round-trips here before this fix).
    const completions = await prisma.lessonCompletion.findMany({
      where: { studentId: { in: studentIds }, lessonId: { in: lessonIds } },
      select: { studentId: true },
    });
    const completionCountByStudent = new Map<string, number>();
    for (const c of completions) {
      completionCountByStudent.set(
        c.studentId,
        (completionCountByStudent.get(c.studentId) ?? 0) + 1
      );
    }
    for (const studentId of studentIds) {
      if ((completionCountByStudent.get(studentId) ?? 0) === lessonIds.length) completedCount++;
    }

    rows.push({
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      enrolledCount,
      completedCount,
      completionPercent: Math.round((completedCount / enrolledCount) * 100),
    });
  }

  return rows;
}

/** Per-course assignment submission rate: actual submissions vs. every
 * enrolled student submitting every assignment. */
export async function getAssignmentCompletionRates(): Promise<AssignmentCompletionRow[]> {
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      _count: { select: { enrollments: true } },
      assignments: { select: { id: true, _count: { select: { submissions: true } } } },
    },
  });

  return courses.map(
    (c: {
      id: string;
      code: string;
      name: string;
      _count: { enrollments: number };
      assignments: { id: string; _count: { submissions: number } }[];
    }) => {
      const totalAssignments = c.assignments.length;
      const possibleSubmissions = totalAssignments * c._count.enrollments;
      const actualSubmissions = c.assignments.reduce(
        (sum: number, a: { _count: { submissions: number } }) => sum + a._count.submissions,
        0
      );
      return {
        courseId: c.id,
        courseCode: c.code,
        courseName: c.name,
        totalAssignments,
        possibleSubmissions,
        actualSubmissions,
        completionPercent:
          possibleSubmissions > 0 ? Math.round((actualSubmissions / possibleSubmissions) * 100) : 0,
      };
    }
  );
}

/** Per-faculty rollup: courses taught, students reached, average attendance
 * across their courses, average result % of their students. */
export async function getFacultyPerformance(): Promise<FacultyPerformanceRow[]> {
  const faculty = await prisma.user.findMany({
    where: { role: "FACULTY" },
    select: {
      id: true,
      name: true,
      email: true,
      facultyCourses: {
        select: {
          id: true,
          _count: { select: { enrollments: true } },
          attendance: { select: { status: true } },
          semesterCourseResults: { select: { marksObtained: true, maxMarks: true } },
        },
      },
    },
  });

  return faculty.map(
    (f: {
      id: string;
      name: string | null;
      email: string;
      facultyCourses: {
        id: string;
        _count: { enrollments: number };
        attendance: { status: string }[];
        semesterCourseResults: { marksObtained: number; maxMarks: number }[];
      }[];
    }) => {
      const courseCount = f.facultyCourses.length;
      const studentCount = f.facultyCourses.reduce((sum, c) => sum + c._count.enrollments, 0);

      const allAttendance = f.facultyCourses.flatMap((c) => c.attendance);
      const presentCount = allAttendance.filter((a) => a.status === "PRESENT").length;
      const avgAttendancePercent =
        allAttendance.length > 0 ? Math.round((presentCount / allAttendance.length) * 100) : 0;

      const allResults = f.facultyCourses.flatMap((c) => c.semesterCourseResults);
      const avgResultPercent =
        allResults.length > 0
          ? Math.round(
              (allResults.reduce((sum, r) => sum + r.marksObtained / r.maxMarks, 0) /
                allResults.length) *
                100
            )
          : 0;

      return {
        facultyId: f.id,
        facultyName: f.name ?? f.email,
        courseCount,
        studentCount,
        avgAttendancePercent,
        avgResultPercent,
      };
    }
  );
}

// ---------------------------------------------------------------------------
// Daily / Monthly Active Users — computed from AuditLog login events, the
// same audit trail the auth module has written to since the very first
// build (LOGIN_SUCCESS / LOGIN_SUCCESS_GOOGLE). No new tracking added.
// ---------------------------------------------------------------------------

const LOGIN_EVENTS = ["LOGIN_SUCCESS", "LOGIN_SUCCESS_GOOGLE"];

export async function getDailyActiveUsers(days = 14): Promise<ActivityPoint[]> {
  const today = todayUTC();
  const start = addDaysUTC(today, -(days - 1));

  const logins = await prisma.auditLog.findMany({
    where: { event: { in: LOGIN_EVENTS }, createdAt: { gte: start }, userId: { not: null } },
    select: { userId: true, createdAt: true },
  });

  const byDay = new Map<string, Set<string>>();
  for (const login of logins) {
    const key = formatISODate(
      toDateOnlyUTC(
        login.createdAt.getUTCFullYear(),
        login.createdAt.getUTCMonth(),
        login.createdAt.getUTCDate()
      )
    );
    if (!byDay.has(key)) byDay.set(key, new Set());
    byDay.get(key)!.add(login.userId!);
  }

  const points: ActivityPoint[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDaysUTC(start, i);
    const key = formatISODate(date);
    const label = `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
    points.push({ label, count: byDay.get(key)?.size ?? 0 });
  }
  return points;
}

export async function getMonthlyActiveUsers(monthsBack = 6): Promise<ActivityPoint[]> {
  const now = todayUTC();
  const monthDates = Array.from({ length: monthsBack }, (_, idx) => {
    const i = monthsBack - 1 - idx;
    return addMonthsUTC(toDateOnlyUTC(now.getUTCFullYear(), now.getUTCMonth(), 1), -i);
  });

  const points = await Promise.all(
    monthDates.map(async (monthDate) => {
      const year = monthDate.getUTCFullYear();
      const monthIndex = monthDate.getUTCMonth();
      const start = toDateOnlyUTC(year, monthIndex, 1);
      const end = addDaysUTC(toDateOnlyUTC(year, monthIndex, daysInMonth(year, monthIndex)), 1);

      const logins = await prisma.auditLog.findMany({
        where: {
          event: { in: LOGIN_EVENTS },
          createdAt: { gte: start, lt: end },
          userId: { not: null },
        },
        select: { userId: true },
      });

      const distinctUsers = new Set(logins.map((l: { userId: string | null }) => l.userId));
      return { label: formatMonthLabel(monthDate), count: distinctUsers.size };
    })
  );

  return points;
}
