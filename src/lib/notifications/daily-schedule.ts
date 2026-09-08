import { prisma } from "@/lib/db/prisma";
import { getAllTimetableSlotsForAdmin, projectDay } from "@/lib/data/timetable";
import { todayUTC, toDateOnlyUTC } from "@/lib/utils/date";

function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h! >= 12 ? "PM" : "AM";
  const hour12 = h! % 12 === 0 ? 12 : h! % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export interface DailyScheduleResult {
  sent: number;
  coursesToday: number;
  message?: string;
  error?: string;
}

/**
 * Posts one course-scoped notification for every course that has at least
 * one session — live class or exam — today. Shared by the automatic
 * morning cron job (src/app/api/cron/daily-schedule/route.ts) and the
 * admin's manual "Send Today's Schedule Now" trigger, so both paths stay
 * in sync and share the same idempotency check (skip a course that
 * already got its notification today, so re-running this manually right
 * after the cron already ran doesn't double-send).
 */
export async function sendDailyScheduleNotifications(): Promise<DailyScheduleResult> {
  const today = todayUTC();
  const dayStart = toDateOnlyUTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);

  const slots = await getAllTimetableSlotsForAdmin();
  const todaysClasses = projectDay(slots, today);
  if (todaysClasses.length === 0) {
    return { sent: 0, coursesToday: 0, message: "No classes scheduled today." };
  }

  const systemAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN", isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!systemAdmin) {
    return { sent: 0, coursesToday: 0, error: "No active admin account to post notifications as." };
  }

  const byCourse = new Map<string, typeof todaysClasses>();
  for (const c of todaysClasses) {
    const list = byCourse.get(c.courseId) ?? [];
    list.push(c);
    byCourse.set(c.courseId, list);
  }

  let sent = 0;
  let alreadySent = 0;
  for (const [courseId, classes] of byCourse) {
    const existing = await prisma.notification.findFirst({
      where: {
        courseId,
        category: "SCHEDULE_CHANGE",
        createdAt: { gte: dayStart, lt: dayEnd },
      },
      select: { id: true },
    });
    if (existing) {
      alreadySent += 1;
      continue;
    }

    const first = classes[0]!;
    const lines = classes
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((c) => {
        const kind = c.isExam ? " (Exam)" : "";
        const topic = c.topic ? ` — ${c.topic}` : "";
        return `• ${to12h(c.startTime)} – ${to12h(c.endTime)}${kind}${topic}`;
      });

    await prisma.notification.create({
      data: {
        title: `Today's Schedule: ${first.courseCode}`,
        body: `Your ${first.courseCode} — ${first.courseName} schedule for today:\n\n${lines.join("\n")}`,
        category: "SCHEDULE_CHANGE",
        courseId,
        createdById: systemAdmin.id,
      },
    });
    sent += 1;
  }

  const message =
    sent === 0 && alreadySent > 0
      ? `Already sent for all ${alreadySent} course(s) with a class today.`
      : undefined;

  return { sent, coursesToday: byCourse.size, message };
}
