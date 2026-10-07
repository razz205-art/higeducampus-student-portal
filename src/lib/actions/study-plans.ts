"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { ensureStudyPlanTable } from "@/lib/data/study-plans";

export interface ActionResult {
  success: boolean;
  message: string;
}

function isAdmin(role: string | undefined): boolean {
  return role === "ACADEMIC_ADMIN" || role === "SUPER_ADMIN";
}

const isoDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.");

const studyPlanSchema = z
  .object({
    courseId: z.string().min(1, "Choose a course."),
    title: z.string().trim().min(2, "Enter a title.").max(150),
    weekLabel: z.string().trim().max(30).optional(),
    url: z.string().trim().url("Enter a valid URL."),
    startDate: isoDate.optional().or(z.literal("")),
    endDate: isoDate.optional().or(z.literal("")),
  })
  .refine(
    (data) => !data.startDate || !data.endDate || data.startDate <= data.endDate,
    { message: "End date must be on or after the start date.", path: ["endDate"] }
  );

export async function createStudyPlanAction(
  input: z.infer<typeof studyPlanSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage study plans." };
  }

  const parsed = studyPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await ensureStudyPlanTable();

  const existingCount = await prisma.studyPlan.count({
    where: { courseId: parsed.data.courseId },
  });

  await prisma.studyPlan.create({
    data: {
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      weekLabel: parsed.data.weekLabel || null,
      url: parsed.data.url,
      startDate: parsed.data.startDate ? new Date(`${parsed.data.startDate}T00:00:00.000Z`) : null,
      endDate: parsed.data.endDate ? new Date(`${parsed.data.endDate}T00:00:00.000Z`) : null,
      order: existingCount + 1,
      uploadedById: session.user.id,
    },
  });

  revalidatePath("/academic-admin/study-plans");
  revalidatePath("/student/study-plans");
  revalidatePath("/student");
  return { success: true, message: "Study plan added." };
}

export async function updateStudyPlanAction(
  planId: string,
  input: z.infer<typeof studyPlanSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage study plans." };
  }

  const parsed = studyPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await ensureStudyPlanTable();

  try {
    await prisma.studyPlan.update({
      where: { id: planId },
      data: {
        courseId: parsed.data.courseId,
        title: parsed.data.title,
        weekLabel: parsed.data.weekLabel || null,
        url: parsed.data.url,
        startDate: parsed.data.startDate ? new Date(`${parsed.data.startDate}T00:00:00.000Z`) : null,
        endDate: parsed.data.endDate ? new Date(`${parsed.data.endDate}T00:00:00.000Z`) : null,
      },
    });
  } catch {
    return { success: false, message: "Study plan not found." };
  }

  revalidatePath("/academic-admin/study-plans");
  revalidatePath("/student/study-plans");
  revalidatePath("/student");
  return { success: true, message: "Study plan updated." };
}

export async function deleteStudyPlanAction(planId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage study plans." };
  }

  await ensureStudyPlanTable();

  try {
    await prisma.studyPlan.delete({ where: { id: planId } });
  } catch {
    return { success: false, message: "Study plan not found." };
  }

  revalidatePath("/academic-admin/study-plans");
  revalidatePath("/student/study-plans");
  revalidatePath("/student");
  return { success: true, message: "Study plan removed." };
}
