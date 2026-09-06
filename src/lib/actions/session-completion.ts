"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import type { SessionCompletionKind } from "@/types/timetable";

export interface ActionResult {
  success: boolean;
  message: string;
}

/**
 * Self-marks a student's own completion of one occurrence of a timetable
 * session — LIVE fires automatically when they click "Join meeting",
 * RECORDING and TEST are explicit self-marked buttons. LIVE and TEST also
 * upsert into the existing AttendanceRecord table as PRESENT, so the
 * student's attendance percentage (already shown elsewhere in the app)
 * reflects this automatically without a separate progress bar. RECORDING
 * is prep-work completion, not attendance, so it's tracked here only.
 */
export async function markSessionCompletionAction(
  timetableSlotId: string,
  date: string,
  kind: SessionCompletionKind
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  const studentId = session.user.id;

  const slot = await prisma.timetableSlot.findUnique({
    where: { id: timetableSlotId },
    select: { courseId: true },
  });
  if (!slot) return { success: false, message: "Class not found." };

  const enrolled = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: slot.courseId } },
  });
  if (!enrolled) return { success: false, message: "You're not enrolled in this course." };

  const dateObj = new Date(`${date}T00:00:00.000Z`);

  await prisma.sessionCompletion.upsert({
    where: {
      studentId_timetableSlotId_date_kind: { studentId, timetableSlotId, date: dateObj, kind },
    },
    update: {},
    create: { studentId, timetableSlotId, date: dateObj, kind },
  });

  if (kind === "LIVE" || kind === "TEST") {
    await prisma.attendanceRecord.upsert({
      where: { studentId_courseId_date: { studentId, courseId: slot.courseId, date: dateObj } },
      update: { status: "PRESENT", source: "SELF_CHECKIN" },
      create: {
        studentId,
        courseId: slot.courseId,
        date: dateObj,
        status: "PRESENT",
        source: "SELF_CHECKIN",
        markedById: studentId,
        notes: kind === "LIVE" ? "Self-marked: joined live class" : "Self-marked: attended test",
      },
    });
  }

  revalidatePath("/student/timetable");
  revalidatePath("/student");
  revalidatePath("/student/attendance");
  revalidatePath("/student/progress");

  return { success: true, message: "Marked." };
}
