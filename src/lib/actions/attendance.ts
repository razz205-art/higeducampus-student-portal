"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import {
  assertFacultyOwnsCourse,
  getActiveSessionDetails,
  getCheckinEligibility,
} from "@/lib/data/attendance";
import { parseISODate } from "@/lib/utils/date";

const statusEnum = z.enum(["PRESENT", "ABSENT", "LEAVE"]);

const markAttendanceSchema = z.object({
  courseId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date."),
  entries: z
    .array(z.object({ studentId: z.string().min(1), status: statusEnum }))
    .min(1, "No students to mark."),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;

export interface ActionResult {
  success: boolean;
  message: string;
}

/**
 * Faculty (or a Super Admin acting with faculty-level access) submits a
 * full day's attendance for one course in a single batch upsert.
 */
export async function markAttendanceAction(input: MarkAttendanceInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "You must be signed in." };
  }
  if (session.user.role !== "FACULTY" && session.user.role !== "SUPER_ADMIN") {
    return { success: false, message: "You don't have permission to mark attendance." };
  }

  const parsed = markAttendanceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { courseId, date, entries } = parsed.data;

  if (session.user.role === "FACULTY") {
    try {
      await assertFacultyOwnsCourse(session.user.id, courseId);
    } catch (err) {
      return { success: false, message: (err as Error).message };
    }
  }

  const dateValue = parseISODate(date);
  const markedById = session.user.id;

  try {
    await prisma.$transaction(
      entries.map((entry) =>
        prisma.attendanceRecord.upsert({
          where: {
            studentId_courseId_date: {
              studentId: entry.studentId,
              courseId,
              date: dateValue,
            },
          },
          update: { status: entry.status, markedById },
          create: {
            studentId: entry.studentId,
            courseId,
            date: dateValue,
            status: entry.status,
            markedById,
          },
        })
      )
    );
  } catch {
    return { success: false, message: "Failed to save attendance. Please try again." };
  }

  revalidatePath("/faculty/attendance");
  revalidatePath("/student/attendance");
  revalidatePath("/academic-admin/attendance");

  return { success: true, message: `Attendance saved for ${entries.length} student(s).` };
}

const updateRecordSchema = z.object({
  recordId: z.string().min(1),
  status: statusEnum,
});

/** Admin correction of a single existing attendance record. */
export async function updateAttendanceRecordAction(
  input: z.infer<typeof updateRecordSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "You must be signed in." };
  }
  if (session.user.role !== "ACADEMIC_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return { success: false, message: "You don't have permission to edit attendance records." };
  }

  const parsed = updateRecordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await prisma.attendanceRecord.update({
      where: { id: parsed.data.recordId },
      data: { status: parsed.data.status, markedById: session.user.id },
    });
  } catch {
    return { success: false, message: "Record not found or could not be updated." };
  }

  revalidatePath("/academic-admin/attendance");
  revalidatePath("/student/attendance");
  revalidatePath("/faculty/attendance");

  return { success: true, message: "Record updated." };
}

// ---------------------------------------------------------------------------
// Live class sessions
// ---------------------------------------------------------------------------

const createSessionSchema = z.object({
  courseId: z.string().min(1),
  batchId: z.string().min(1).optional(),
  subjectLabel: z.string().trim().max(150).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM format."),
  platform: z.enum(["ZOOM", "GOOGLE_MEET"]),
  meetingLink: z.string().trim().url("Enter a valid meeting URL."),
});

/**
 * Faculty creates a live class + generates its attendance session. The
 * session is created inactive — an Admin must activate it before students
 * can check in (see setActiveSessionAction).
 */
export async function createLiveClassSessionAction(
  input: z.infer<typeof createSessionSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "You must be signed in." };
  }
  if (session.user.role !== "FACULTY" && session.user.role !== "SUPER_ADMIN") {
    return { success: false, message: "You don't have permission to start a live class." };
  }

  const parsed = createSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  if (session.user.role === "FACULTY") {
    try {
      await assertFacultyOwnsCourse(session.user.id, data.courseId);
    } catch (err) {
      return { success: false, message: (err as Error).message };
    }
  }

  await prisma.liveClassSession.create({
    data: {
      courseId: data.courseId,
      batchId: data.batchId,
      subjectLabel: data.subjectLabel,
      date: parseISODate(data.date),
      startTime: data.startTime,
      platform: data.platform,
      meetingLink: data.meetingLink,
      facultyId: session.user.id,
      isActive: false,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      event: "LIVE_SESSION_CREATED",
      metadata: { courseId: data.courseId, date: data.date, platform: data.platform },
    },
  });

  revalidatePath("/faculty/attendance");
  revalidatePath("/academic-admin/attendance");

  return { success: true, message: "Live class session created. An admin can now activate it." };
}

/**
 * Admin activates exactly one session — this is what actually opens the
 * public check-in form. Any other currently-active session is deactivated
 * in the same transaction, enforcing "only one session active at a time."
 */
export async function setActiveSessionAction(sessionId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "You must be signed in." };
  }
  if (session.user.role !== "ACADEMIC_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return { success: false, message: "You don't have permission to manage attendance sessions." };
  }
  if (!sessionId || typeof sessionId !== "string") {
    return { success: false, message: "Invalid session." };
  }

  const target = await prisma.liveClassSession.findUnique({ where: { id: sessionId } });
  if (!target) {
    return { success: false, message: "Session not found." };
  }

  await prisma.$transaction([
    prisma.liveClassSession.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    }),
    prisma.liveClassSession.update({
      where: { id: sessionId },
      data: { isActive: true },
    }),
  ]);

  await prisma.auditLog.create({
    data: { userId: session.user.id, event: "LIVE_SESSION_ACTIVATED", metadata: { sessionId } },
  });

  revalidatePath("/attendance");
  revalidatePath("/academic-admin/attendance");
  revalidatePath("/faculty/attendance");

  return { success: true, message: "Attendance window opened for this session." };
}

/** Admin closes whichever session is currently active. */
export async function deactivateSessionAction(sessionId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "You must be signed in." };
  }
  if (session.user.role !== "ACADEMIC_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return { success: false, message: "You don't have permission to manage attendance sessions." };
  }

  await prisma.liveClassSession.update({
    where: { id: sessionId },
    data: { isActive: false },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, event: "LIVE_SESSION_DEACTIVATED", metadata: { sessionId } },
  });

  revalidatePath("/attendance");
  revalidatePath("/academic-admin/attendance");
  revalidatePath("/faculty/attendance");

  return { success: true, message: "Attendance window closed." };
}

/**
 * Student self check-in via the permanent /attendance link. Every
 * eligibility check here is re-verified independently of the page's
 * precheck (getCheckinEligibility) — that function is UX only, this is the
 * actual security boundary. IP and User-Agent are captured for the audit
 * trail per the module's security requirements.
 */
export async function submitOwnAttendanceAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "You must be signed in." };
  }
  if (session.user.role !== "STUDENT") {
    return { success: false, message: "Only students can check in to attendance." };
  }

  const active = await getActiveSessionDetails();
  if (!active) {
    return { success: false, message: "Attendance is currently closed." };
  }

  const eligibility = await getCheckinEligibility(session.user.id, active);
  if (!eligibility.eligible) {
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        event: "ATTENDANCE_SELF_CHECKIN_REJECTED",
        metadata: { sessionId: active.id, reason: eligibility.reason },
      },
    });
    return { success: false, message: eligibility.reason ?? "You are not eligible to check in." };
  }
  if (eligibility.alreadyCheckedIn) {
    return { success: false, message: "You have already marked attendance for this session." };
  }

  const headerList = headers();
  const ipAddress = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = headerList.get("user-agent");

  try {
    await prisma.attendanceRecord.create({
      data: {
        studentId: session.user.id,
        courseId: active.courseId,
        date: parseISODate(active.date),
        status: "PRESENT",
        source: "SELF_CHECKIN",
        sessionId: active.id,
        markedById: session.user.id,
        ipAddress,
        userAgent,
      },
    });
  } catch {
    // Most likely the unique (studentId, courseId, date) constraint —
    // i.e. a race with another concurrent submission for the same day.
    return { success: false, message: "You have already marked attendance for this session." };
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      event: "ATTENDANCE_SELF_CHECKIN",
      metadata: { sessionId: active.id, courseId: active.courseId },
      ipAddress: ipAddress ?? undefined,
    },
  });

  revalidatePath("/attendance");
  revalidatePath("/student/attendance");
  revalidatePath("/academic-admin/attendance");

  return { success: true, message: "Attendance marked successfully." };
}
