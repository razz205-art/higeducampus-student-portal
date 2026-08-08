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

const courseResultSchema = z.object({
  courseId: z.string().min(1),
  marksObtained: z.coerce.number().min(0),
  maxMarks: z.coerce.number().min(1),
  grade: z.string().trim().min(1).max(5),
});

const publishSchema = z.object({
  studentId: z.string().min(1, "Choose a student."),
  semesterLabel: z.string().trim().min(2, "Enter a semester label.").max(50),
  gpa: z.coerce.number().min(0).max(10),
  percentage: z.coerce.number().min(0).max(100),
  status: z.enum(["PASS", "FAIL", "PENDING"]),
  courseResults: z.array(courseResultSchema).max(20).default([]),
});

/** Creates or replaces a student's result for one semester (upsert by studentId+semesterLabel). */
export async function publishSemesterResultAction(
  input: z.infer<typeof publishSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to publish results." };
  }

  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { studentId, semesterLabel, gpa, percentage, status, courseResults } = parsed.data;

  const semesterResult = await prisma.semesterResult.upsert({
    where: { studentId_semesterLabel: { studentId, semesterLabel } },
    update: { gpa, percentage, status, createdById: session.user.id },
    create: { studentId, semesterLabel, gpa, percentage, status, createdById: session.user.id },
  });

  await prisma.$transaction([
    prisma.semesterCourseResult.deleteMany({ where: { semesterResultId: semesterResult.id } }),
    ...courseResults.map((cr) =>
      prisma.semesterCourseResult.create({
        data: {
          semesterResultId: semesterResult.id,
          courseId: cr.courseId,
          marksObtained: cr.marksObtained,
          maxMarks: cr.maxMarks,
          grade: cr.grade,
        },
      })
    ),
  ]);

  revalidatePath("/academic-admin/results");
  revalidatePath("/student/results");

  return { success: true, message: "Semester result published." };
}

export async function deleteSemesterResultAction(semesterResultId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage results." };
  }

  try {
    await prisma.semesterResult.delete({ where: { id: semesterResultId } });
  } catch {
    return { success: false, message: "Result not found." };
  }

  revalidatePath("/academic-admin/results");
  revalidatePath("/student/results");

  return { success: true, message: "Semester result removed." };
}
