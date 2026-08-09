"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/security/password";
import { Role } from "@prisma/client";

export interface ActionResult {
  success: boolean;
  message: string;
}

function isAdmin(role: string | undefined): boolean {
  return role === "ACADEMIC_ADMIN" || role === "SUPER_ADMIN";
}

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Enter a full name.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(10, "Password must be at least 10 characters."),
  role: z.enum(["STUDENT", "FACULTY"]),
  batchId: z.string().min(1).optional(),
  courseIds: z.array(z.string().min(1)).max(20).optional(),
});

/**
 * Admin-provisioned account creation — the only way a Faculty account gets
 * created (there is no faculty self-registration, by design: see the auth
 * module's notes on why self-registration is restricted to Student). Also
 * usable for admin-created Student accounts, as an alternative to student
 * self-registration.
 */
export async function createUserAction(
  input: z.infer<typeof createUserSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to create accounts." };
  }

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { name, email, password, role, batchId, courseIds } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, message: "An account with that email already exists." };
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role as Role,
      batchId: role === "STUDENT" ? batchId || null : null,
      emailVerified: new Date(),
    },
  });

  if (role === "STUDENT" && courseIds && courseIds.length > 0) {
    await prisma.enrollment.createMany({
      data: courseIds.map((courseId) => ({ studentId: user.id, courseId })),
      skipDuplicates: true,
    });
  }

  revalidatePath(role === "STUDENT" ? "/academic-admin/students" : "/academic-admin/faculty");

  return {
    success: true,
    message: `${role === "STUDENT" ? "Student" : "Faculty"} account created.`,
  };
}

export async function toggleUserActiveAction(
  userId: string,
  isActive: boolean
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage accounts." };
  }
  if (userId === session.user.id) {
    return { success: false, message: "You can't deactivate your own account." };
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { isActive } });
  } catch {
    return { success: false, message: "Account not found." };
  }

  revalidatePath("/academic-admin/students");
  revalidatePath("/academic-admin/faculty");

  return { success: true, message: isActive ? "Account reactivated." : "Account disabled." };
}

// ---------------------------------------------------------------------------
// Bulk student creation — one row per line, pasted in. Password is optional
// per row: if left blank, a random temporary password is generated and
// returned so the admin can share it, rather than requiring 50 typed
// passwords by hand.
// ---------------------------------------------------------------------------

export interface BulkStudentRow {
  name: string;
  email: string;
  password?: string;
  batchName?: string;
}

export interface BulkRowResult {
  row: number;
  email: string;
  status: "created" | "skipped";
  message: string;
  password?: string; // only present when auto-generated
}

function generateTempPassword(): string {
  return randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 12);
}

const bulkRowSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().trim().min(10).optional(),
  batchName: z.string().trim().min(1).optional(),
});

export async function bulkCreateStudentsAction(
  rows: BulkStudentRow[]
): Promise<{ success: boolean; message: string; results: BulkRowResult[] }> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "You must be signed in.", results: [] };
  }
  if (!isAdmin(session.user.role)) {
    return {
      success: false,
      message: "You don't have permission to create accounts.",
      results: [],
    };
  }
  if (rows.length === 0 || rows.length > 200) {
    return { success: false, message: "Paste between 1 and 200 rows.", results: [] };
  }

  const batches = await prisma.batch.findMany({ select: { id: true, name: true } });
  const batchByName = new Map<string, string>(
    batches.map((b: { id: string; name: string }) => [b.name, b.id])
  );

  const results: BulkRowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 1;
    const parsed = bulkRowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      results.push({
        row: rowNum,
        email: rows[i]?.email ?? "—",
        status: "skipped",
        message: parsed.error.issues[0]?.message ?? "Invalid row.",
      });
      continue;
    }
    const { name, email, batchName } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      results.push({ row: rowNum, email, status: "skipped", message: "Email already exists." });
      continue;
    }

    let batchId: string | null = null;
    if (batchName) {
      const found = batchByName.get(batchName);
      if (!found) {
        results.push({
          row: rowNum,
          email,
          status: "skipped",
          message: `Batch "${batchName}" not found.`,
        });
        continue;
      }
      batchId = found;
    }

    const usedGenerated = !parsed.data.password;
    const rawPassword = parsed.data.password ?? generateTempPassword();
    const passwordHash = await hashPassword(rawPassword);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "STUDENT" as Role,
        batchId,
        emailVerified: new Date(),
      },
    });

    results.push({
      row: rowNum,
      email,
      status: "created",
      message: "Created.",
      password: usedGenerated ? rawPassword : undefined,
    });
  }

  revalidatePath("/academic-admin/students");

  const createdCount = results.filter((r) => r.status === "created").length;
  return {
    success: true,
    message: `${createdCount} of ${rows.length} account${rows.length === 1 ? "" : "s"} created.`,
    results,
  };
}
