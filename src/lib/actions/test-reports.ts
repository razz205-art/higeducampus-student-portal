"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { deleteTestReportById } from "@/lib/data/test-reports";

export interface ActionResult {
  success: boolean;
  message: string;
}

function isAdmin(role: string | undefined): boolean {
  return role === "ACADEMIC_ADMIN" || role === "SUPER_ADMIN";
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Minimal CSV parser: handles quoted fields and escaped quotes ("" inside a quoted field). */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\r") {
      // skip, handled by \n below (covers both \r\n and lone \r)
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

async function parseSpreadsheet(file: File): Promise<string[][]> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) {
    return parseCSV(buffer.toString("utf-8"));
  }

  const workbook = new ExcelJS.Workbook();
  // exceljs's bundled type definitions expect a Buffer shape that doesn't
  // structurally match the Buffer type currently active in this project
  // (a strict-typing mismatch only, not a real bug — the bytes passed in
  // are a completely normal Buffer at runtime). `as any` sidesteps the
  // type check for just this one call without weakening anything else.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(buffer as any);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const rows: string[][] = [];
  worksheet.eachRow((row) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      const v = cell.value;
      if (v instanceof Date) {
        // Excel duration/time cells (e.g. a "time taken" column formatted
        // as HH:MM:SS) decode to a Date anchored at Excel's 1899 epoch.
        // cell.text falls back to Date#toString() for these instead of a
        // clean clock time, so read the wall-clock time directly instead.
        const hh = String(v.getUTCHours()).padStart(2, "0");
        const mm = String(v.getUTCMinutes()).padStart(2, "0");
        const ss = String(v.getUTCSeconds()).padStart(2, "0");
        cells.push(hh === "00" ? `${mm}:${ss}` : `${hh}:${mm}:${ss}`);
      } else {
        cells.push(cell.text ?? "");
      }
    });
    rows.push(cells);
  });
  return rows;
}

export type TestReportMatchStatus = "matched" | "not_found" | "ambiguous";

export interface TestReportPreviewRow {
  rowNumber: number;
  rank: number;
  name: string;
  percentage: number;
  correct: number | null;
  incorrect: number | null;
  timeRaw: string | null;
  status: "PASS" | "NEEDS_IMPROVEMENT";
  matchStatus: TestReportMatchStatus;
  studentId: string | null;
  studentName: string | null;
}

export interface TestReportPreviewResult {
  success: boolean;
  message?: string;
  rows: TestReportPreviewRow[];
}

/**
 * Parses an uploaded file into a full-class preview. Unlike the semester
 * results bulk upload, every row is kept here (even ones with no student
 * match) — the whole point of a test report is an accurate class-wide
 * leaderboard and stats, so an unmatched name still needs to count toward
 * the total, average, and distribution, it just won't be linked to a
 * student account (and so won't show on that student's own results page).
 */
export async function previewTestReportUploadAction(
  formData: FormData
): Promise<TestReportPreviewResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in.", rows: [] };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to publish reports.", rows: [] };
  }

  const file = formData.get("file");
  const passingPercentageRaw = formData.get("passingPercentage");
  const passingPercentage = Number(passingPercentageRaw);
  const courseId = String(formData.get("courseId") ?? "");
  const batchId = String(formData.get("batchId") ?? "");

  if (!courseId) {
    return { success: false, message: "Choose a course.", rows: [] };
  }
  if (!batchId) {
    return { success: false, message: "Choose a batch.", rows: [] };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Choose a file to upload.", rows: [] };
  }
  if (!Number.isFinite(passingPercentage) || passingPercentage < 0 || passingPercentage > 100) {
    return { success: false, message: "Enter a valid passing percentage (0–100).", rows: [] };
  }

  let table: string[][];
  try {
    table = await parseSpreadsheet(file);
  } catch {
    return {
      success: false,
      message: "Couldn't read that file. Make sure it's a valid .csv or .xlsx file.",
      rows: [],
    };
  }
  if (table.length < 2) {
    return { success: false, message: "The file has no data rows.", rows: [] };
  }

  const headerRow = table[0]!.map((h) => h.trim().toLowerCase());
  const nameCol = headerRow.findIndex((h) => h === "name");
  const percentageCol = headerRow.findIndex((h) => h === "percentage");
  const rankCol = headerRow.findIndex((h) => h === "rank");
  const correctCol = headerRow.findIndex((h) => h === "correct");
  const incorrectCol = headerRow.findIndex((h) => h === "incorrect");
  const timeCol = headerRow.findIndex((h) => h === "time");

  if (nameCol === -1 || percentageCol === -1) {
    return {
      success: false,
      message: 'The file needs a "Name" column and a "Percentage" column.',
      rows: [],
    };
  }

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      batchId,
      enrollments: { some: { courseId } },
    },
    select: { id: true, name: true, email: true },
  });
  const byNormalizedName = new Map<string, { id: string; name: string | null; email: string }[]>();
  for (const s of students) {
    const key = normalizeName(s.name ?? s.email);
    const list = byNormalizedName.get(key) ?? [];
    list.push(s);
    byNormalizedName.set(key, list);
  }

  type Draft = Omit<TestReportPreviewRow, "rank">;
  const drafts: Draft[] = [];

  for (let i = 1; i < table.length; i++) {
    const cells = table[i]!;
    const name = (cells[nameCol] ?? "").trim();
    const percentageRaw = (cells[percentageCol] ?? "").trim();
    if (!name && !percentageRaw) continue;

    const percentage = Number(percentageRaw);
    const matches = byNormalizedName.get(normalizeName(name)) ?? [];
    const matchStatus: TestReportMatchStatus =
      matches.length === 1 ? "matched" : matches.length > 1 ? "ambiguous" : "not_found";

    const correct = correctCol !== -1 ? Number((cells[correctCol] ?? "").trim()) : NaN;
    const incorrect = incorrectCol !== -1 ? Number((cells[incorrectCol] ?? "").trim()) : NaN;
    const timeRaw = timeCol !== -1 ? (cells[timeCol] ?? "").trim() : "";

    drafts.push({
      rowNumber: i + 1,
      name,
      percentage: Number.isFinite(percentage) ? percentage : 0,
      correct: Number.isFinite(correct) ? correct : null,
      incorrect: Number.isFinite(incorrect) ? incorrect : null,
      timeRaw: timeRaw || null,
      status: percentage >= passingPercentage ? "PASS" : "NEEDS_IMPROVEMENT",
      matchStatus,
      studentId: matchStatus === "matched" ? matches[0]!.id : null,
      studentName: matchStatus === "matched" ? (matches[0]!.name ?? matches[0]!.email) : null,
    });
  }

  // Use the file's own Rank column when present; otherwise derive rank by
  // sorting on percentage (highest first), matching how the sample export
  // itself ranks students.
  let rows: TestReportPreviewRow[];
  if (rankCol !== -1) {
    rows = drafts.map((d, idx) => {
      const rankValue = Number((table[idx + 1]![rankCol] ?? "").trim());
      return { ...d, rank: Number.isFinite(rankValue) ? rankValue : idx + 1 };
    });
  } else {
    const sorted = [...drafts].sort((a, b) => b.percentage - a.percentage);
    const rankByRowNumber = new Map(sorted.map((d, idx) => [d.rowNumber, idx + 1]));
    rows = drafts.map((d) => ({ ...d, rank: rankByRowNumber.get(d.rowNumber) ?? 0 }));
  }
  rows.sort((a, b) => a.rank - b.rank);

  return { success: true, rows };
}

const publishRowSchema = z.object({
  rank: z.coerce.number().int().min(1),
  name: z.string().trim().min(1),
  percentage: z.coerce.number().min(0).max(100),
  correct: z.coerce.number().int().min(0).nullable(),
  incorrect: z.coerce.number().int().min(0).nullable(),
  timeRaw: z.string().nullable(),
  status: z.enum(["PASS", "NEEDS_IMPROVEMENT"]),
  studentId: z.string().nullable(),
});

const publishTestReportSchema = z.object({
  title: z.string().trim().min(2, "Enter a title for this test.").max(80),
  courseId: z.string().min(1, "Choose a course."),
  batchId: z.string().min(1, "Choose a batch."),
  passingPercentage: z.coerce.number().min(0).max(100),
  rows: z.array(publishRowSchema).min(1, "No rows to publish."),
});

export async function publishTestReportAction(
  input: z.infer<typeof publishTestReportSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to publish reports." };
  }

  const parsed = publishTestReportSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { title, courseId, batchId, passingPercentage, rows } = parsed.data;

  await prisma.testReport.create({
    data: {
      title,
      courseId,
      batchId,
      passingPercentage,
      createdById: session.user.id,
      entries: {
        create: rows.map((r) => ({
          rank: r.rank,
          name: r.name,
          percentage: r.percentage,
          correct: r.correct,
          incorrect: r.incorrect,
          timeRaw: r.timeRaw,
          status: r.status,
          studentId: r.studentId,
        })),
      },
    },
  });

  revalidatePath("/academic-admin/test-reports");
  revalidatePath("/student/test-reports");

  return { success: true, message: `Published "${title}" with ${rows.length} students.` };
}

export async function deleteTestReportAction(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to manage reports." };
  }

  try {
    await deleteTestReportById(id);
  } catch {
    return { success: false, message: "Report not found." };
  }

  revalidatePath("/academic-admin/test-reports");
  revalidatePath("/student/test-reports");

  return { success: true, message: "Test report removed." };
}
