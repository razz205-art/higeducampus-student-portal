"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { assertStudentCanToggleLesson } from "@/lib/data/progress";

export interface ActionResult {
  success: boolean;
  message: string;
}

const toggleSchema = z.object({
  lessonId: z.string().min(1),
  completed: z.boolean(),
});

/** Student marks a lesson complete or incomplete. */
export async function toggleLessonCompletionAction(
  input: z.infer<typeof toggleSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "You must be signed in." };
  }
  if (session.user.role !== "STUDENT") {
    return { success: false, message: "Only students can track lesson progress." };
  }

  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Invalid request." };
  }
  const { lessonId, completed } = parsed.data;

  try {
    await assertStudentCanToggleLesson(session.user.id, lessonId);
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }

  if (completed) {
    await prisma.lessonCompletion.upsert({
      where: { studentId_lessonId: { studentId: session.user.id, lessonId } },
      update: {},
      create: { studentId: session.user.id, lessonId },
    });
  } else {
    await prisma.lessonCompletion.deleteMany({
      where: { studentId: session.user.id, lessonId },
    });
  }

  revalidatePath("/student/progress");

  return { success: true, message: completed ? "Marked complete." : "Marked incomplete." };
}
