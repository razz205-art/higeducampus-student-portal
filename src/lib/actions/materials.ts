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

const materialSchema = z.object({
  courseId: z.string().min(1, "Choose a course."),
  moduleId: z.string().min(1, "Choose or create a chapter."),
  title: z.string().trim().min(2, "Enter a title.").max(150),
  description: z.string().trim().max(500).optional(),
  type: z.enum(["DOCUMENT", "VIDEO", "LINK"]),
  url: z.string().trim().url("Enter a valid URL."),
  fileSize: z.string().trim().max(20).optional(),
});

export async function createMaterialAction(
  input: z.infer<typeof materialSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage study materials." };
  }

  const parsed = materialSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await prisma.studyMaterial.create({
    data: {
      courseId: parsed.data.courseId,
      moduleId: parsed.data.moduleId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      type: parsed.data.type,
      url: parsed.data.url,
      fileSize: parsed.data.fileSize || null,
      uploadedById: session.user.id,
    },
  });

  revalidatePath("/academic-admin/materials");
  revalidatePath("/student/materials");
  revalidatePath("/student");
  return { success: true, message: "Study material added." };
}

export async function deleteMaterialAction(materialId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage study materials." };
  }

  try {
    await prisma.studyMaterial.delete({ where: { id: materialId } });
  } catch {
    return { success: false, message: "Material not found." };
  }

  revalidatePath("/academic-admin/materials");
  revalidatePath("/student/materials");
  revalidatePath("/student");
  return { success: true, message: "Study material removed." };
}

const chapterSchema = z.object({
  courseId: z.string().min(1, "Choose a course."),
  title: z.string().trim().min(2, "Enter a chapter title.").max(100),
});

/**
 * Chapters ("modules") had no admin UI at all before this — they were
 * seed-provisioned only, same original gap as Course/Batch. order is
 * assigned automatically as the next number for the course.
 */
export async function createChapterAction(
  input: z.infer<typeof chapterSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage chapters." };
  }

  const parsed = chapterSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existingCount = await prisma.module.count({ where: { courseId: parsed.data.courseId } });

  await prisma.module.create({
    data: {
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      order: existingCount + 1,
    },
  });

  revalidatePath("/academic-admin/materials");
  return { success: true, message: "Chapter added." };
}
