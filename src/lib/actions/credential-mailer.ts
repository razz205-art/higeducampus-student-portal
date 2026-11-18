"use server";

import ExcelJS from "exceljs";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { parseCsv } from "@/lib/utils/csv";
import {
  sendCredentialEmails,
  renderCredentialEmail,
  type CredentialSendResult,
} from "@/lib/email/credential-mailer";

/**
 * Bulk credential mailer — admin uploads a spreadsheet of
 * Name / Username / Password / Email and every row gets an email with its
 * own login details. Entirely separate from "Add students": nothing here
 * creates, updates, or even looks up portal accounts.
 */

const MAX_ROWS = 500;

export interface CredentialRow {
  row: number; // 1-based spreadsheet row number, for the admin's reference
  name: string;
  username: string;
  password: string;
  email: string;
  error?: string;
}

function isAdmin(role: string | undefined): boolean {
  return role === "ACADEMIC_ADMIN" || role === "SUPER_ADMIN";
}

// ---------------------------------------------------------------------------
// File parsing
// ---------------------------------------------------------------------------

const COLUMN_ALIASES: Record<"name" | "username" | "password" | "email", string[]> = {
  name: [
    "name",
    "full name",
    "display name",
    "displayname",
    "student name",
    "candidate name",
    "student",
  ],
  username: [
    "username",
    "user name",
    "user id",
    "userid",
    "user_id",
    "login id",
    "loginid",
    "login",
    "login username",
  ],
  password: ["password", "pass", "pwd", "login password"],
  email: ["email", "email id", "emailid", "e-mail", "e mail", "mail", "mail id", "email address"],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.:*]/g, "");
}

/** ExcelJS returns rich objects for hyperlinks, rich text, formulas and dates. */
function cellToString(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("richText" in v && Array.isArray(v.richText)) {
      return v.richText.map((t) => t.text).join("");
    }
    if ("text" in v && v.text !== undefined) {
      // Hyperlink cells (Excel auto-links typed email addresses).
      const t = v.text as unknown;
      if (typeof t === "string") return t;
      if (t && typeof t === "object" && "richText" in t) {
        return (t as { richText: { text: string }[] }).richText.map((x) => x.text).join("");
      }
    }
    if ("result" in v && v.result !== undefined && v.result !== null) {
      return cellToString(v.result as ExcelJS.CellValue);
    }
    if ("hyperlink" in v && typeof v.hyperlink === "string") {
      return v.hyperlink.replace(/^mailto:/i, "");
    }
  }
  return String(v);
}

async function readCells(file: File): Promise<string[][]> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".csv")) {
    return parseCsv(await file.text());
  }
  if (lower.endsWith(".xlsx")) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    // Bridging a @types/node Buffer generic mismatch against exceljs's
    // older type declarations; the runtime value is a valid Buffer either way.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.worksheets[0];
    const cells: string[][] = [];
    sheet?.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      const values: string[] = [];
      for (let c = 1; c <= row.cellCount; c++) {
        values.push(cellToString(row.getCell(c).value).trim());
      }
      cells[rowNumber - 1] = values;
    });
    // eachRow can leave holes for fully empty rows; normalise to arrays.
    return Array.from(cells, (r) => r ?? []);
  }
  throw new Error("UNSUPPORTED");
}

const emailSchema = z.string().email();

export async function parseCredentialsFileAction(formData: FormData): Promise<{
  success: boolean;
  message: string;
  rows: CredentialRow[];
}> {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to do this.", rows: [] };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, message: "No file uploaded.", rows: [] };
  }

  let cells: string[][];
  try {
    cells = await readCells(file);
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error && err.message === "UNSUPPORTED"
          ? "Unsupported file type — upload a .xlsx or .csv file (old .xls files: re-save as .xlsx)."
          : "Couldn't read that file — make sure it's a valid Excel or CSV file.",
      rows: [],
    };
  }

  // Find the header row within the first 10 rows (allows a title row above it).
  let headerIndex = -1;
  let colIndex: Record<keyof typeof COLUMN_ALIASES, number> = {
    name: -1,
    username: -1,
    password: -1,
    email: -1,
  };
  for (let i = 0; i < Math.min(cells.length, 10); i++) {
    const headers = (cells[i] ?? []).map(normalizeHeader);
    const found = { name: -1, username: -1, password: -1, email: -1 };
    (Object.keys(COLUMN_ALIASES) as (keyof typeof COLUMN_ALIASES)[]).forEach((key) => {
      found[key] = headers.findIndex((h) => COLUMN_ALIASES[key].includes(h));
    });
    if (found.username >= 0 && found.password >= 0 && found.email >= 0) {
      headerIndex = i;
      colIndex = found;
      break;
    }
  }

  if (headerIndex < 0) {
    return {
      success: false,
      message:
        "Couldn't find the header row. The first row should have the columns: Name, Username, Password, Email (Name is optional). Download the template to see the format.",
      rows: [],
    };
  }

  const get = (r: string[], idx: number) => (idx >= 0 ? (r[idx] ?? "").trim() : "");
  const rows: CredentialRow[] = [];

  for (let i = headerIndex + 1; i < cells.length; i++) {
    const r = cells[i] ?? [];
    if (!r.some((c) => (c ?? "").trim() !== "")) continue;

    const row: CredentialRow = {
      row: i + 1,
      name: get(r, colIndex.name),
      username: get(r, colIndex.username),
      password: get(r, colIndex.password),
      email: get(r, colIndex.email).toLowerCase(),
    };

    if (!row.email) row.error = "Missing email";
    else if (!emailSchema.safeParse(row.email).success) row.error = "Invalid email";
    else if (!row.username) row.error = "Missing username";
    else if (!row.password) row.error = "Missing password";

    rows.push(row);
  }

  if (rows.length === 0) {
    return { success: false, message: "No data rows found below the header.", rows: [] };
  }
  if (rows.length > MAX_ROWS) {
    return {
      success: false,
      message: `This file has ${rows.length} rows — the limit is ${MAX_ROWS} per upload. Split it into smaller files.`,
      rows: [],
    };
  }

  const valid = rows.filter((r) => !r.error).length;
  return {
    success: true,
    message: `${valid} of ${rows.length} row${rows.length === 1 ? "" : "s"} ready to send.`,
    rows,
  };
}

// ---------------------------------------------------------------------------
// Preview + send
// ---------------------------------------------------------------------------

const optionsSchema = z.object({
  subject: z.string().trim().min(3, "Enter an email subject.").max(150),
});

const sendRowSchema = z.object({
  row: z.number().int().positive(),
  name: z.string().max(150),
  username: z.string().trim().min(1).max(200),
  password: z.string().min(1).max(200),
  email: z.string().trim().toLowerCase().email(),
});

export async function previewCredentialEmailAction(
  sample: { name: string; username: string; password: string },
  options: z.infer<typeof optionsSchema>
): Promise<{ success: boolean; message: string; html?: string }> {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to do this." };
  }
  const parsed = optionsSchema.safeParse(options);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid settings." };
  }
  return { success: true, message: "", html: renderCredentialEmail(sample, parsed.data) };
}

export async function sendBulkCredentialsAction(
  rows: Omit<CredentialRow, "error">[],
  options: z.infer<typeof optionsSchema>
): Promise<{ success: boolean; message: string; results: CredentialSendResult[] }> {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to do this.", results: [] };
  }

  const opts = optionsSchema.safeParse(options);
  if (!opts.success) {
    return {
      success: false,
      message: opts.error.issues[0]?.message ?? "Invalid settings.",
      results: [],
    };
  }

  const parsedRows = z.array(sendRowSchema).max(MAX_ROWS).safeParse(rows);
  if (!parsedRows.success) {
    return {
      success: false,
      message: "Some rows are invalid — re-upload the file and try again.",
      results: [],
    };
  }
  if (parsedRows.data.length === 0) {
    return { success: false, message: "There are no valid rows to send.", results: [] };
  }

  let results: CredentialSendResult[];
  try {
    results = await sendCredentialEmails(parsedRows.data, opts.data);
  } catch {
    return {
      success: false,
      message:
        "Email isn't configured — RESEND_API_KEY is missing in Vercel environment variables.",
      results: [],
    };
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const failed = results.length - sent;
  return {
    success: sent > 0,
    message:
      failed === 0
        ? `All ${sent} email${sent === 1 ? "" : "s"} sent.`
        : `${sent} sent, ${failed} failed — see the table below.`,
    results,
  };
}
