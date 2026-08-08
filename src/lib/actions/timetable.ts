"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export interface ActionResult {
  success: boolean;
  message: string;
}

function isAdmin(role: string | undefined): boolean {
  return role === "ACADEMIC_ADMIN" || role === "SUPER_ADMIN";
}

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const slotSchema = z
  .object({
    courseId: z.string().min(1, "Choose a course."),
    batchId: z.string().min(1).optional(),
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(timeRegex, "Use 24-hour HH:MM format."),
    endTime: z.string().regex(timeRegex, "Use 24-hour HH:MM format."),
    location: z.string().trim().max(120).optional(),
    meetingLink: z.union([z.string().trim().url("Enter a valid URL."), z.literal("")]).optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

export async function createTimetableSlotAction(
  input: z.infer<typeof slotSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to edit the timetable." };
  }

  const parsed = slotSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { courseId, batchId, dayOfWeek, startTime, endTime, location, meetingLink } = parsed.data;

  await prisma.timetableSlot.create({
    data: {
      courseId,
      batchId: batchId || null,
      dayOfWeek,
      startTime,
      endTime,
      location: location || null,
      meetingLink: meetingLink || null,
      createdById: session.user.id,
    },
  });

  revalidatePath("/academic-admin/timetable");
  revalidatePath("/student/timetable");
  revalidatePath("/faculty/timetable");

  return { success: true, message: "Class added to the timetable." };
}

const updateSchema = slotSchema.and(z.object({ slotId: z.string().min(1) }));

export async function updateTimetableSlotAction(
  input: z.infer<typeof updateSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to edit the timetable." };
  }

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { slotId, courseId, batchId, dayOfWeek, startTime, endTime, location, meetingLink } =
    parsed.data;

  try {
    await prisma.timetableSlot.update({
      where: { id: slotId },
      data: {
        courseId,
        batchId: batchId || null,
        dayOfWeek,
        startTime,
        endTime,
        location: location || null,
        meetingLink: meetingLink || null,
      },
    });
  } catch {
    return { success: false, message: "Class not found or could not be updated." };
  }

  revalidatePath("/academic-admin/timetable");
  revalidatePath("/student/timetable");
  revalidatePath("/faculty/timetable");

  return { success: true, message: "Class updated." };
}

export async function toggleTimetableSlotActiveAction(
  slotId: string,
  isActive: boolean
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to edit the timetable." };
  }

  try {
    await prisma.timetableSlot.update({ where: { id: slotId }, data: { isActive } });
  } catch {
    return { success: false, message: "Class not found." };
  }

  revalidatePath("/academic-admin/timetable");
  revalidatePath("/student/timetable");
  revalidatePath("/faculty/timetable");

  return { success: true, message: isActive ? "Class re-enabled." : "Class disabled." };
}

export async function deleteTimetableSlotAction(slotId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to edit the timetable." };
  }

  try {
    await prisma.timetableSlot.delete({ where: { id: slotId } });
  } catch {
    return { success: false, message: "Class not found." };
  }

  revalidatePath("/academic-admin/timetable");
  revalidatePath("/student/timetable");
  revalidatePath("/faculty/timetable");

  return { success: true, message: "Class removed from the timetable." };
}
