import { prisma } from "@/lib/db/prisma";
import { getStudentCourses, getFacultyCourses } from "@/lib/data/attendance";
import { formatISODate, toDateOnlyUTC, daysInMonth, addDaysUTC } from "@/lib/utils/date";
import type {
  TimetableSlotItem,
  ProjectedClass,
  ClassStatus,
  CalendarDay,
} from "@/types/timetable";

function toItem(s: {
  id: string;
  courseId: string;
  batchId: string | null;
  topic: string | null;
  specificDate: Date | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string | null;
  meetingLink: string | null;
  isActive: boolean;
  isExam: boolean;
  course: { code: string; name: string; faculty: { name: string | null; email: string } };
  batch: { name: string } | null;
}): TimetableSlotItem {
  return {
    id: s.id,
    courseId: s.courseId,
    courseCode: s.course.code,
    courseName: s.course.name,
    facultyName: s.course.faculty.name ?? s.course.faculty.email,
    batchId: s.batchId,
    batchName: s.batch?.name ?? null,
    topic: s.topic,
    specificDate: s.specificDate ? formatISODate(s.specificDate) : null,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    location: s.location,
    meetingLink: s.meetingLink,
    isActive: s.isActive,
    isExam: s.isExam,
  };
}

const SLOT_INCLUDE = {
  course: {
    select: { code: true, name: true, faculty: { select: { name: true, email: true } } },
  },
  batch: { select: { name: true } },
} as const;

export async function getStudentTimetableSlots(studentId: string): Promise<TimetableSlotItem[]> {
  const [courses, student] = await Promise.all([
    getStudentCourses(studentId),
    prisma.user.findUnique({ where: { id: studentId }, select: { batchId: true } }),
  ]);
  const courseIds = courses.map((c) => c.id);
  if (courseIds.length === 0) return [];

  const slots = await prisma.timetableSlot.findMany({
    where: {
      courseId: { in: courseIds },
      isActive: true,
      OR: [{ batchId: null }, { batchId: student?.batchId ?? undefined }],
    },
    include: SLOT_INCLUDE,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return slots.map(toItem);
}

export async function getFacultyTimetableSlots(facultyId: string): Promise<TimetableSlotItem[]> {
  const courses = await getFacultyCourses(facultyId);
  const courseIds = courses.map((c) => c.id);
  if (courseIds.length === 0) return [];

  const slots = await prisma.timetableSlot.findMany({
    where: { courseId: { in: courseIds }, isActive: true },
    include: SLOT_INCLUDE,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return slots.map(toItem);
}

export async function getAllTimetableSlotsForAdmin(
  courseId?: string
): Promise<TimetableSlotItem[]> {
  const slots = await prisma.timetableSlot.findMany({
    where: courseId ? { courseId } : {},
    include: SLOT_INCLUDE,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return slots.map(toItem);
}

// ---------------------------------------------------------------------------
// Projection: turning a recurring weekly pattern into real calendar dates.
// ---------------------------------------------------------------------------

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function computeStatus(
  slot: Pick<TimetableSlotItem, "startTime" | "endTime">,
  date: Date,
  now: Date = new Date()
): ClassStatus {
  const today = toDateOnlyUTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (date.getTime() > today.getTime()) return "scheduled";
  if (date.getTime() < today.getTime()) return "completed";

  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const start = timeToMinutes(slot.startTime);
  const end = timeToMinutes(slot.endTime);
  if (nowMinutes < start) return "upcoming";
  if (nowMinutes >= start && nowMinutes < end) return "ongoing";
  return "completed";
}

/**
 * All slots that occur on this exact date, projected onto it — either
 * because it's a one-time class whose specificDate matches exactly, or
 * because it's a recurring weekly class (no specificDate) whose dayOfWeek
 * matches this date's weekday.
 */
export function projectDay(slots: TimetableSlotItem[], date: Date): ProjectedClass[] {
  const dayOfWeek = date.getUTCDay();
  const dateStr = formatISODate(date);
  return slots
    .filter((s) => (s.specificDate ? s.specificDate === dateStr : s.dayOfWeek === dayOfWeek))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((s) => ({ ...s, date: dateStr, status: computeStatus(s, date) }));
}

export interface ProjectedWeekDay {
  date: string;
  dayOfWeek: number;
  classes: ProjectedClass[];
}

/** Projects a full week (starting from `weekStart`, a Sunday) onto real dates. */
export function projectWeek(slots: TimetableSlotItem[], weekStart: Date): ProjectedWeekDay[] {
  const days: ProjectedWeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDaysUTC(weekStart, i);
    days.push({
      date: formatISODate(date),
      dayOfWeek: date.getUTCDay(),
      classes: projectDay(slots, date),
    });
  }
  return days;
}

/** Per-day class counts for a full month — powers the Calendar View grid. */
export function projectMonthCounts(
  slots: TimetableSlotItem[],
  year: number,
  monthIndex: number
): CalendarDay[] {
  const total = daysInMonth(year, monthIndex);
  const days: CalendarDay[] = [];
  for (let d = 1; d <= total; d++) {
    const date = toDateOnlyUTC(year, monthIndex, d);
    const dayOfWeek = date.getUTCDay();
    const dateStr = formatISODate(date);
    const count = slots.filter((s) =>
      s.specificDate ? s.specificDate === dateStr : s.dayOfWeek === dayOfWeek
    ).length;
    days.push({ date: dateStr, dayOfWeek, classCount: count });
  }
  return days;
}
