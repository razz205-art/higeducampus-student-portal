"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export interface ActionResult {
  success: boolean;
  message: string;
}

function isAdmin(role: string | undefined): boolean {
  return role === "ACADEMIC_ADMIN" || role === "SUPER_ADMIN";
}

export interface BatchCourseAccessRow {
  id: string; // CourseBatch id, used to revoke
  courseId: string;
  courseCode: string;
  courseName: string;
}

/** Courses a batch currently has standing access to. */
export async function getBatchCourseAccessAction(batchId: string): Promise<{
  success: boolean;
  message?: string;
  rows: BatchCourseAccessRow[];
}> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in.", rows: [] };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to view this.", rows: [] };
  }

  const rows = await prisma.courseBatch.findMany({
    where: { batchId },
    include: { course: { select: { code: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return {
    success: true,
    rows: rows.map((r: { id: string; courseId: string; course: { code: string; name: string } }) => ({
      id: r.id,
      courseId: r.courseId,
      courseCode: r.course.code,
      courseName: r.course.name,
    })),
  };
}

/**
 * Grants an entire batch access to a course: creates the standing
 * CourseBatch link (so future students added to the batch get enrolled
 * automatically — see enrollStudentInBatchCourses below), and immediately
 * enrolls every student currently in the batch.
 */
export async function grantBatchCourseAccessAction(
  batchId: string,
  courseId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage course access." };
  }
  if (!batchId || !courseId) {
    return { success: false, message: "Choose a course." };
  }

  const existing = await prisma.courseBatch.findUnique({
    where: { courseId_batchId: { courseId, batchId } },
  });
  if (existing) {
    return { success: false, message: "This batch already has access to that course." };
  }

  await prisma.courseBatch.create({ data: { courseId, batchId } });

  const students = await prisma.user.findMany({
    where: { studentBatches: { some: { batchId } }, role: "STUDENT" },
    select: { id: true },
  });
  if (students.length > 0) {
    await prisma.enrollment.createMany({
      data: students.map((s: { id: string }) => ({ studentId: s.id, courseId })),
      skipDuplicates: true,
    });
  }

  revalidatePath("/academic-admin/batches");
  revalidatePath("/academic-admin/students");
  revalidatePath("/academic-admin/courses");

  return {
    success: true,
    message: `Course access granted to ${students.length} student${students.length === 1 ? "" : "s"}.`,
  };
}

/**
 * Revokes a batch's standing access to a course: removes the CourseBatch
 * link and un-enrolls every student currently in the batch from that
 * course. Students individually enrolled through the per-student course
 * picker are affected the same way — there's no way to tell "how" a given
 * Enrollment row was created, so this removes access uniformly for anyone
 * currently in the batch.
 */
export async function revokeBatchCourseAccessAction(courseBatchId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage course access." };
  }

  const link = await prisma.courseBatch.findUnique({ where: { id: courseBatchId } });
  if (!link) {
    return { success: false, message: "That course access grant no longer exists." };
  }

  await prisma.courseBatch.delete({ where: { id: courseBatchId } });
  await prisma.enrollment.deleteMany({
    where: { courseId: link.courseId, student: { studentBatches: { some: { batchId: link.batchId } } } },
  });

  revalidatePath("/academic-admin/batches");
  revalidatePath("/academic-admin/students");
  revalidatePath("/academic-admin/courses");

  return { success: true, message: "Course access revoked for that batch." };
}

/**
 * Called right after a new student account is created with a batch
 * assigned — enrolls them in every course that batch already has standing
 * access to. This is what makes batch access "live": a student who joins
 * a batch today automatically gets every course that batch was already
 * granted, without an admin re-doing anything.
 */
export async function enrollStudentInBatchCourses(
  studentId: string,
  batchId: string
): Promise<void> {
  const grants = await prisma.courseBatch.findMany({
    where: { batchId },
    select: { courseId: true },
  });
  if (grants.length === 0) return;

  await prisma.enrollment.createMany({
    data: grants.map((g: { courseId: string }) => ({ studentId, courseId: g.courseId })),
    skipDuplicates: true,
  });
}
