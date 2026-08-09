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

const batchSchema = z
  .object({
    name: z.string().trim().min(2, "Enter a batch name.").max(50),
    startYear: z.coerce.number().int().min(2000).max(2100),
    endYear: z.coerce.number().int().min(2000).max(2100),
  })
  .refine((data) => data.endYear > data.startYear, {
    message: "End year must be after start year.",
    path: ["endYear"],
  });

export async function createBatchAction(input: z.infer<typeof batchSchema>): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage batches." };
  }

  const parsed = batchSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await prisma.batch.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return { success: false, message: "A batch with that name already exists." };
  }

  await prisma.batch.create({ data: parsed.data });

  revalidatePath("/academic-admin/batches");
  revalidatePath("/academic-admin/students");
  return { success: true, message: "Batch created." };
}

export async function deleteBatchAction(batchId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage batches." };
  }

  try {
    await prisma.batch.delete({ where: { id: batchId } });
  } catch {
    return {
      success: false,
      message: "Couldn't delete this batch — it may still have students assigned to it.",
    };
  }

  revalidatePath("/academic-admin/batches");
  revalidatePath("/academic-admin/students");
  return { success: true, message: "Batch deleted." };
}
