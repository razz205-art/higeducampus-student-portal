"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { getStudentCourses } from "@/lib/data/attendance";

export interface ActionResult {
  success: boolean;
  message: string;
}

const submissionSchema = z
  .object({
    assignmentId: z.string().min(1),
    submissionUrl: z.union([z.string().trim().url("Enter a valid URL."), z.literal("")]).optional(),
    submissionNote: z.string().trim().max(3000).optional(),
  })
  .refine((data) => (data.submissionUrl && data.submissionUrl.length > 0) || data.submissionNote, {
    message: "Add a link, a note, or both.",
    path: ["submissionNote"],
  });

/**
 * Students submit a link (e.g. their doc/repo/drive URL) and/or a text
 * note — same URL-reference pattern used for study materials, since no
 * file storage provider is configured in this project. Re-submitting
 * before an assignment is graded overwrites the previous submission;
 * once graded, resubmitting clears the score back to ungraded, since
 * new content needs a fresh look.
 */
export async function submitAssignmentAction(
  input: z.infer<typeof submissionSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (session.user.role !== "STUDENT") {
    return { success: false, message: "Only students can submit assignments." };
  }

  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: parsed.data.assignmentId },
    select: { courseId: true },
  });
  if (!assignment) return { success: false, message: "Assignment not found." };

  const enrolledCourses = await getStudentCourses(session.user.id);
  const isEnrolled = enrolledCourses.some((c) => c.id === assignment.courseId);
  if (!isEnrolled) {
    return { success: false, message: "You're not enrolled in this course." };
  }

  await prisma.assignmentSubmission.upsert({
    where: {
      studentId_assignmentId: {
        studentId: session.user.id,
        assignmentId: parsed.data.assignmentId,
      },
    },
    update: {
      submissionUrl: parsed.data.submissionUrl || null,
      submissionNote: parsed.data.submissionNote || null,
      submittedAt: new Date(),
      status: "SUBMITTED",
      score: null,
    },
    create: {
      studentId: session.user.id,
      assignmentId: parsed.data.assignmentId,
      submissionUrl: parsed.data.submissionUrl || null,
      submissionNote: parsed.data.submissionNote || null,
    },
  });

  revalidatePath("/student/assignments");

  return { success: true, message: "Assignment submitted." };
}
