"use server";

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
  const { name, email, password, role, batchId } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, message: "An account with that email already exists." };
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role as Role,
      batchId: role === "STUDENT" ? batchId || null : null,
      emailVerified: new Date(),
    },
  });

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
