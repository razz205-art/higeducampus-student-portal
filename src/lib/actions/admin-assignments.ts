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

const assignmentSchema = z.object({
  courseId: z.string().min(1, "Choose a course."),
  title: z.string().trim().min(3, "Enter a title.").max(150),
  dueDate: z.string().min(1, "Choose a due date."),
  maxScore: z.coerce.number().int().min(1).max(1000),
});

export async function createAssignmentAction(
  input: z.infer<typeof assignmentSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage assignments." };
  }

  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await prisma.assignment.create({
    data: {
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      dueDate: new Date(parsed.data.dueDate),
      maxScore: parsed.data.maxScore,
    },
  });

  revalidatePath("/academic-admin/assignments");
  return { success: true, message: "Assignment created." };
}

export async function deleteAssignmentAction(assignmentId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage assignments." };
  }

  try {
    await prisma.assignment.delete({ where: { id: assignmentId } });
  } catch {
    return { success: false, message: "Assignment not found." };
  }

  revalidatePath("/academic-admin/assignments");
  return { success: true, message: "Assignment deleted." };
}
