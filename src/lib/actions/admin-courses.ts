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

const courseSchema = z.object({
  code: z.string().trim().min(2, "Enter a course code.").max(20),
  name: z.string().trim().min(2, "Enter a course name.").max(150),
  facultyId: z.string().min(1, "Choose a faculty member."),
});

export async function createCourseAction(
  input: z.infer<typeof courseSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage courses." };
  }

  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await prisma.course.findUnique({ where: { code: parsed.data.code } });
  if (existing) {
    return { success: false, message: "A course with that code already exists." };
  }

  await prisma.course.create({ data: parsed.data });

  revalidatePath("/academic-admin/courses");
  return { success: true, message: "Course created." };
}

const updateSchema = courseSchema.extend({ courseId: z.string().min(1) });

export async function updateCourseAction(
  input: z.infer<typeof updateSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage courses." };
  }

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { courseId, ...data } = parsed.data;

  try {
    await prisma.course.update({ where: { id: courseId }, data });
  } catch {
    return { success: false, message: "Course not found or could not be updated." };
  }

  revalidatePath("/academic-admin/courses");
  return { success: true, message: "Course updated." };
}

export async function deleteCourseAction(courseId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage courses." };
  }

  try {
    await prisma.course.delete({ where: { id: courseId } });
  } catch {
    return {
      success: false,
      message: "Couldn't delete this course — it may still have related records.",
    };
  }

  revalidatePath("/academic-admin/courses");
  return { success: true, message: "Course deleted." };
}
