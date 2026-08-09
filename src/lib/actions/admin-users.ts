"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/security/password";
import { parseCsv } from "@/lib/utils/csv";
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

async function processBulkStudentRows(rows: BulkStudentRow[]): Promise<BulkRowResult[]> {
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

  return results;
}

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

  const results = await processBulkStudentRows(rows);

  revalidatePath("/academic-admin/students");

  const createdCount = results.filter((r) => r.status === "created").length;
  return {
    success: true,
    message: `${createdCount} of ${rows.length} account${rows.length === 1 ? "" : "s"} created.`,
    results,
  };
}

// ---------------------------------------------------------------------------
// Bulk student creation from an uploaded CSV/Excel file. The file is parsed
// in-memory during this request and discarded — never written to disk or
// any storage provider, since none is configured in this project.
// ---------------------------------------------------------------------------

const HEADER_WORDS = new Set(["name", "full name", "student name"]);

function rowsFromCells(cells: string[][]): BulkStudentRow[] {
  const dataRows =
    cells[0]?.[0] && HEADER_WORDS.has(cells[0][0].trim().toLowerCase()) ? cells.slice(1) : cells;

  return dataRows
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => ({
      name: (r[0] ?? "").trim(),
      email: (r[1] ?? "").trim(),
      password: (r[2] ?? "").trim() || undefined,
      batchName: (r[3] ?? "").trim() || undefined,
    }));
}

export async function bulkCreateStudentsFromFileAction(
  formData: FormData
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

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, message: "No file uploaded.", results: [] };
  }

  const name = file.name.toLowerCase();
  let cells: string[][];

  try {
    if (name.endsWith(".csv")) {
      const text = await file.text();
      cells = parseCsv(text);
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const workbook = new ExcelJS.Workbook();
      // Bridging a @types/node Buffer generic mismatch against exceljs's
      // older type declarations; the runtime value is a valid Buffer either way.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await workbook.xlsx.load(buffer as any);
      const sheet = workbook.worksheets[0];
      cells = [];
      sheet?.eachRow((row) => {
        const values = (row.values as (string | number | null)[]).slice(1);
        cells.push(values.map((v) => (v === null || v === undefined ? "" : String(v))));
      });
    } else {
      return {
        success: false,
        message: "Unsupported file type — upload a .csv or .xlsx file.",
        results: [],
      };
    }
  } catch {
    return {
      success: false,
      message: "Couldn't read that file — make sure it's a valid CSV or Excel file.",
      results: [],
    };
  }

  const rows = rowsFromCells(cells);
  if (rows.length === 0) {
    return { success: false, message: "No student rows found in the file.", results: [] };
  }
  if (rows.length > 200) {
    return { success: false, message: "Files are limited to 200 rows.", results: [] };
  }

  const results = await processBulkStudentRows(rows);

  revalidatePath("/academic-admin/students");

  const createdCount = results.filter((r) => r.status === "created").length;
  return {
    success: true,
    message: `${createdCount} of ${rows.length} account${rows.length === 1 ? "" : "s"} created.`,
    results,
  };
}
