import { prisma } from "@/lib/db/prisma";
import {
  toDateOnlyUTC,
  formatISODate,
  formatMonthLabel,
  daysInMonth,
  addMonthsUTC,
  parseISODate,
} from "@/lib/utils/date";
import type {
  AttendanceSummary,
  CalendarDay,
  AttendanceHistoryRow,
  AttendanceTrendPoint,
  CourseOption,
  RosterEntry,
  AdminCourseAttendanceRow,
  AdminStudentAttendanceRow,
  LiveSessionRow,
  ActiveSessionDetails,
  BatchOption,
  MeetingPlatform,
} from "@/types/attendance";
import type { AttendanceStatus } from "@prisma/client";

function summarize(records: { status: AttendanceStatus }[]): AttendanceSummary {
  const total = records.length;
  const present = records.filter((r) => r.status === "PRESENT").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;
  const leave = records.filter((r) => r.status === "LEAVE").length;
  const percentage = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;
  return { total, present, absent, leave, percentage };
}

// ---------------------------------------------------------------------------
// Student views
// ---------------------------------------------------------------------------

export async function getStudentCourses(studentId: string): Promise<CourseOption[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: { course: { select: { id: true, code: true, name: true } } },
    orderBy: { course: { code: "asc" } },
  });
  return enrollments.map((e: { course: CourseOption }) => e.course);
}

export async function getStudentAttendanceSummary(
  studentId: string,
  courseId?: string
): Promise<AttendanceSummary> {
  const records = await prisma.attendanceRecord.findMany({
    where: { studentId, ...(courseId ? { courseId } : {}) },
    select: { status: true },
  });
  return summarize(records);
}

export async function getStudentCalendarMonth(
  studentId: string,
  year: number,
  monthIndex: number,
  courseId?: string
): Promise<CalendarDay[]> {
  const start = toDateOnlyUTC(year, monthIndex, 1);
  const end = toDateOnlyUTC(year, monthIndex, daysInMonth(year, monthIndex));

  const records = await prisma.attendanceRecord.findMany({
    where: {
      studentId,
      ...(courseId ? { courseId } : {}),
      date: { gte: start, lte: end },
    },
    select: { date: true, status: true },
  });

  const byDate = new Map<string, AttendanceStatus>();
  for (const r of records) {
    // A student can have multiple courses on the same day; if any is
    // ABSENT that's the most important signal for a single-cell calendar,
    // otherwise prefer LEAVE, otherwise PRESENT.
    const key = formatISODate(r.date);
    const existing = byDate.get(key);
    if (!existing || r.status === "ABSENT" || (r.status === "LEAVE" && existing === "PRESENT")) {
      byDate.set(key, r.status);
    }
  }

  const total = daysInMonth(year, monthIndex);
  const days: CalendarDay[] = [];
  for (let d = 1; d <= total; d++) {
    const date = toDateOnlyUTC(year, monthIndex, d);
    const key = formatISODate(date);
    days.push({ date: key, status: byDate.get(key) ?? null });
  }
  return days;
}

export async function getStudentAttendanceHistory(
  studentId: string,
  limit = 20,
  courseId?: string,
  exactDate?: string
): Promise<AttendanceHistoryRow[]> {
  const records = await prisma.attendanceRecord.findMany({
    where: {
      studentId,
      ...(courseId ? { courseId } : {}),
      ...(exactDate ? { date: parseISODate(exactDate) } : {}),
    },
    include: { course: { select: { code: true, name: true } } },
    orderBy: { date: "desc" },
    take: limit,
  });

  return records.map(
    (r: {
      id: string;
      date: Date;
      status: AttendanceStatus;
      course: { code: string; name: string };
    }) => ({
      id: r.id,
      date: formatISODate(r.date),
      courseCode: r.course.code,
      courseName: r.course.name,
      status: r.status,
    })
  );
}

/** One row per enrolled course, each with its own summary — "course-wise / subject-wise" view. */
export async function getStudentCourseWiseAttendance(
  studentId: string
): Promise<(CourseOption & { summary: AttendanceSummary })[]> {
  const courses = await getStudentCourses(studentId);
  return Promise.all(
    courses.map(async (course) => ({
      ...course,
      summary: await getStudentAttendanceSummary(studentId, course.id),
    }))
  );
}

export async function getStudentAttendanceTrend(
  studentId: string,
  monthsBack = 6,
  courseId?: string
): Promise<AttendanceTrendPoint[]> {
  const now = new Date();
  const points: AttendanceTrendPoint[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const monthDate = addMonthsUTC(toDateOnlyUTC(now.getUTCFullYear(), now.getUTCMonth(), 1), -i);
    const year = monthDate.getUTCFullYear();
    const monthIndex = monthDate.getUTCMonth();
    const start = toDateOnlyUTC(year, monthIndex, 1);
    const end = toDateOnlyUTC(year, monthIndex, daysInMonth(year, monthIndex));

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId, ...(courseId ? { courseId } : {}), date: { gte: start, lte: end } },
      select: { status: true },
    });

    const summary = summarize(records);
    points.push({ month: formatMonthLabel(monthDate), percentage: summary.percentage });
  }

  return points;
}

// ---------------------------------------------------------------------------
// Faculty views
// ---------------------------------------------------------------------------

/** Courses this faculty member teaches — as the primary faculty, or as an assigned co-faculty. */
export async function getFacultyCourses(facultyId: string): Promise<CourseOption[]> {
  return prisma.course.findMany({
    where: { OR: [{ facultyId }, { additionalFaculty: { some: { facultyId } } }] },
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
  });
}

/** Throws unless this faculty member is the primary or an assigned co-faculty for the course. */
export async function assertFacultyOwnsCourse(facultyId: string, courseId: string): Promise<void> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { facultyId: true, additionalFaculty: { select: { facultyId: true } } },
  });
  const isAssigned =
    course &&
    (course.facultyId === facultyId ||
      course.additionalFaculty.some((cf: { facultyId: string }) => cf.facultyId === facultyId));
  if (!isAssigned) {
    throw new Error("You do not have permission to manage attendance for this course.");
  }
}

export async function getCourseRoster(courseId: string, date: Date): Promise<RosterEntry[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: { student: { select: { id: true, name: true, email: true } } },
    orderBy: { student: { name: "asc" } },
  });

  const existing = await prisma.attendanceRecord.findMany({
    where: { courseId, date },
    select: { studentId: true, status: true },
  });
  const statusByStudent = new Map(
    existing.map((r: { studentId: string; status: AttendanceStatus }) => [r.studentId, r.status])
  );

  return enrollments.map((e: { student: { id: string; name: string | null; email: string } }) => ({
    studentId: e.student.id,
    name: e.student.name ?? e.student.email,
    email: e.student.email,
    status: statusByStudent.get(e.student.id) ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Admin views
// ---------------------------------------------------------------------------

export async function getAdminCourseOverview(): Promise<AdminCourseAttendanceRow[]> {
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      faculty: { select: { name: true, email: true } },
      _count: { select: { enrollments: true } },
      attendance: { select: { status: true } },
    },
    orderBy: { code: "asc" },
  });

  return courses.map(
    (c: {
      id: string;
      code: string;
      name: string;
      faculty: { name: string | null; email: string };
      _count: { enrollments: number };
      attendance: { status: AttendanceStatus }[];
    }) => ({
      courseId: c.id,
      code: c.code,
      name: c.name,
      facultyName: c.faculty.name ?? c.faculty.email,
      enrolledCount: c._count.enrollments,
      averagePercentage: summarize(c.attendance).percentage,
    })
  );
}

export async function getAdminStudentRowsForCourse(
  courseId: string,
  range?: { from: Date; to: Date }
): Promise<AdminStudentAttendanceRow[]> {
  const dateFilter = range ? { date: { gte: range.from, lte: range.to } } : {};

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          attendanceRecords: { where: { courseId, ...dateFilter }, select: { status: true } },
        },
      },
    },
    orderBy: { student: { name: "asc" } },
  });

  return enrollments.map(
    (e: {
      student: {
        id: string;
        name: string | null;
        email: string;
        attendanceRecords: { status: AttendanceStatus }[];
      };
    }) => ({
      studentId: e.student.id,
      name: e.student.name ?? e.student.email,
      email: e.student.email,
      summary: summarize(e.student.attendanceRecords),
    })
  );
}

export async function getAllCourses(): Promise<CourseOption[]> {
  return prisma.course.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
  });
}

export async function getRecentCourseRecords(
  courseId: string,
  limit = 30,
  range?: { from: Date; to: Date }
): Promise<{ id: string; date: string; studentName: string; status: AttendanceStatus }[]> {
  const dateFilter = range ? { date: { gte: range.from, lte: range.to } } : {};

  const records = await prisma.attendanceRecord.findMany({
    where: { courseId, ...dateFilter },
    include: { student: { select: { name: true, email: true } } },
    orderBy: [{ date: "desc" }, { student: { name: "asc" } }],
    take: limit,
  });

  return records.map(
    (r: {
      id: string;
      date: Date;
      status: AttendanceStatus;
      student: { name: string | null; email: string };
    }) => ({
      id: r.id,
      date: formatISODate(r.date),
      studentName: r.student.name ?? r.student.email,
      status: r.status,
    })
  );
}

// ---------------------------------------------------------------------------
// Live class sessions
// ---------------------------------------------------------------------------

export async function getBatches(): Promise<BatchOption[]> {
  return prisma.batch.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

function toLiveSessionRow(s: {
  id: string;
  course: { code: string; name: string };
  subjectLabel: string | null;
  batch: { name: string } | null;
  faculty: { name: string | null; email: string };
  date: Date;
  startTime: string;
  platform: MeetingPlatform;
  meetingLink: string;
  isActive: boolean;
}): LiveSessionRow {
  return {
    id: s.id,
    courseCode: s.course.code,
    courseName: s.course.name,
    subjectLabel: s.subjectLabel ?? s.course.name,
    batchName: s.batch?.name ?? null,
    facultyName: s.faculty.name ?? s.faculty.email,
    date: formatISODate(s.date),
    startTime: s.startTime,
    platform: s.platform,
    meetingLink: s.meetingLink,
    isActive: s.isActive,
  };
}

export async function getFacultyLiveSessions(facultyId: string): Promise<LiveSessionRow[]> {
  const sessions = await prisma.liveClassSession.findMany({
    where: { facultyId },
    include: {
      course: { select: { code: true, name: true } },
      batch: { select: { name: true } },
      faculty: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return sessions.map(toLiveSessionRow);
}

export async function getAllLiveSessionsForAdmin(): Promise<LiveSessionRow[]> {
  const sessions = await prisma.liveClassSession.findMany({
    include: {
      course: { select: { code: true, name: true } },
      batch: { select: { name: true } },
      faculty: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return sessions.map(toLiveSessionRow);
}

/** The single currently-open session, if any — drives the public /attendance form. */
export async function getActiveSessionDetails(): Promise<ActiveSessionDetails | null> {
  const session = await prisma.liveClassSession.findFirst({
    where: { isActive: true },
    include: {
      course: { select: { id: true, code: true, name: true } },
      batch: { select: { id: true, name: true } },
      faculty: { select: { name: true, email: true } },
    },
  });
  if (!session) return null;

  return {
    id: session.id,
    courseId: session.course.id,
    courseCode: session.course.code,
    courseName: session.course.name,
    subjectLabel: session.subjectLabel ?? session.course.name,
    batchId: session.batch?.id ?? null,
    batchName: session.batch?.name ?? null,
    facultyName: session.faculty.name ?? session.faculty.email,
    date: formatISODate(session.date),
    startTime: session.startTime,
    platform: session.platform,
  };
}

export interface CheckinEligibility {
  eligible: boolean;
  alreadyCheckedIn: boolean;
  reason?: string;
}

/**
 * Read-only precheck used by the /attendance page to show a clear message
 * before the student even clicks the button. The server action re-verifies
 * all of this independently at write time — this function is for UX, not
 * the security boundary.
 */
export async function getCheckinEligibility(
  studentId: string,
  session: ActiveSessionDetails
): Promise<CheckinEligibility> {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { isActive: true, batchId: true },
  });

  if (!student || !student.isActive) {
    return { eligible: false, alreadyCheckedIn: false, reason: "Your account is not active." };
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: session.courseId } },
  });
  if (!enrollment) {
    return {
      eligible: false,
      alreadyCheckedIn: false,
      reason: "You are not enrolled in this course.",
    };
  }

  if (session.batchId && student.batchId !== session.batchId) {
    return {
      eligible: false,
      alreadyCheckedIn: false,
      reason: "This session is restricted to a different batch.",
    };
  }

  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      studentId_courseId_date: {
        studentId,
        courseId: session.courseId,
        date: parseISODate(session.date),
      },
    },
  });

  return { eligible: true, alreadyCheckedIn: !!existing };
}
