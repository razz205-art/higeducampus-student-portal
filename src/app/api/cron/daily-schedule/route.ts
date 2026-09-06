import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAllTimetableSlotsForAdmin, projectDay } from "@/lib/data/timetable";
import { todayUTC, toDateOnlyUTC } from "@/lib/utils/date";

function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h! >= 12 ? "PM" : "AM";
  const hour12 = h! % 12 === 0 ? 12 : h! % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Runs automatically every morning (see vercel.json) and posts one
 * course-scoped notification for every course that has at least one
 * session — live class or exam — today, so students see it the same way
 * they'd see any other announcement. Scoped per course (not one big daily
 * digest) because the existing Notification model can only target a
 * single course or batch at a time, and course-scoping is what actually
 * reaches the right students without inventing a new per-student
 * broadcast mechanism.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const today = todayUTC();
  const dayStart = toDateOnlyUTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);

  const slots = await getAllTimetableSlotsForAdmin();
  const todaysClasses = projectDay(slots, today);
  if (todaysClasses.length === 0) {
    return NextResponse.json({ sent: 0, message: "No classes scheduled today." });
  }

  const systemAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN", isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!systemAdmin) {
    return NextResponse.json({ error: "No active admin account to post notifications as." }, { status: 500 });
  }

  const byCourse = new Map<string, typeof todaysClasses>();
  for (const c of todaysClasses) {
    const list = byCourse.get(c.courseId) ?? [];
    list.push(c);
    byCourse.set(c.courseId, list);
  }

  let sent = 0;
  for (const [courseId, classes] of byCourse) {
    // Idempotency: skip if this course's schedule notification already
    // went out today (in case the cron fires more than once).
    const existing = await prisma.notification.findFirst({
      where: {
        courseId,
        category: "SCHEDULE_CHANGE",
        createdAt: { gte: dayStart, lt: dayEnd },
      },
      select: { id: true },
    });
    if (existing) continue;

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

  return NextResponse.json({ sent, coursesToday: byCourse.size });
}
