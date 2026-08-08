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

const examSchema = z.object({
  title: z.string().trim().min(2, "Enter an exam title.").max(120),
  examDate: z.string().min(1, "Choose an exam date and time."),
  description: z.string().trim().max(500).optional(),
});

/** Admin creates a new exam countdown entry. */
export async function createExamAction(input: z.infer<typeof examSchema>): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage exams." };
  }

  const parsed = examSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const examDate = new Date(parsed.data.examDate);
  if (Number.isNaN(examDate.getTime())) {
    return { success: false, message: "Invalid date." };
  }

  await prisma.exam.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      examDate,
      createdById: session.user.id,
    },
  });

  revalidatePath("/academic-admin/exams");
  revalidatePath("/student/exams");

  return { success: true, message: "Exam added." };
}

const updateSchema = examSchema.extend({ examId: z.string().min(1) });

/** Admin edits an exam's title/date/description — "Admin can change dates." */
export async function updateExamAction(input: z.infer<typeof updateSchema>): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage exams." };
  }

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const examDate = new Date(parsed.data.examDate);
  if (Number.isNaN(examDate.getTime())) {
    return { success: false, message: "Invalid date." };
  }

  try {
    await prisma.exam.update({
      where: { id: parsed.data.examId },
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        examDate,
      },
    });
  } catch {
    return { success: false, message: "Exam not found or could not be updated." };
  }

  revalidatePath("/academic-admin/exams");
  revalidatePath("/student/exams");

  return { success: true, message: "Exam updated." };
}

/** Admin archives/restores an exam without deleting its history. */
export async function toggleExamActiveAction(
  examId: string,
  isActive: boolean
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage exams." };
  }

  try {
    await prisma.exam.update({ where: { id: examId }, data: { isActive } });
  } catch {
    return { success: false, message: "Exam not found." };
  }

  revalidatePath("/academic-admin/exams");
  revalidatePath("/student/exams");

  return { success: true, message: isActive ? "Exam restored." : "Exam archived." };
}

/** Admin permanently deletes an exam entry. */
export async function deleteExamAction(examId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage exams." };
  }

  try {
    await prisma.exam.delete({ where: { id: examId } });
  } catch {
    return { success: false, message: "Exam not found." };
  }

  revalidatePath("/academic-admin/exams");
  revalidatePath("/student/exams");

  return { success: true, message: "Exam deleted." };
}
