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
  title: z.string().trim().min(2, "Enter a title.").max(150),
  description: z.string().trim().max(500).optional(),
  type: z.enum(["DOCUMENT", "VIDEO", "LINK"]),
  url: z.string().trim().url("Enter a valid URL."),
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
      title: parsed.data.title,
      description: parsed.data.description || null,
      type: parsed.data.type,
      url: parsed.data.url,
      uploadedById: session.user.id,
    },
  });

  revalidatePath("/academic-admin/materials");
  revalidatePath("/student/materials");
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
  return { success: true, message: "Study material removed." };
}
