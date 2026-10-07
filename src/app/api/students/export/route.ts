import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { formatISODate } from "@/lib/utils/date";
import { buildReportResponse, parseFormat, checkReportRateLimit } from "@/lib/utils/report-export";

const UNASSIGNED_BATCH_KEY = "__unassigned__";

function isAdmin(role: string | undefined): boolean {
  return role === "ACADEMIC_ADMIN" || role === "SUPER_ADMIN";
}

/**
 * Downloads the Students list, grouped/sorted batch-wise so it matches the
 * grouping already shown on the admin Students page. ?batchId=all (default)
 * exports every batch (a multi-batch student appears once per batch, same
 * as the on-screen grouping); ?batchId=<id> or "__unassigned__" exports just
 * that one group. ?format=csv|xlsx|pdf (defaults to csv).
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const rateLimitError = checkReportRateLimit(session.user.id);
  if (rateLimitError) {
    return NextResponse.json({ error: rateLimitError.retryMessage }, { status: 429 });
  }

  const batchId = req.nextUrl.searchParams.get("batchId") ?? "all";
  const format = parseFormat(req.nextUrl.searchParams.get("format"));

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: {
      name: true,
      email: true,
      registrationNumber: true,
      isActive: true,
      createdAt: true,
      studentBatches: {
        select: { batch: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { enrollments: true } },
    },
    orderBy: { name: "asc" },
  });

  type StudentRow = (typeof students)[number];

  function toRow(s: StudentRow, batchLabel: string) {
    return [
      batchLabel,
      s.name ?? "",
      s.email,
      s.registrationNumber ?? "",
      s._count.enrollments,
      s.isActive ? "Active" : "Disabled",
      formatISODate(s.createdAt),
    ];
  }

  const headers = ["Batch", "Name", "Email", "Registration No.", "Courses", "Status", "Joined"];
  let rows: (string | number)[][];
  let title: string;
  let filenameBase: string;

  if (batchId === "all") {
    const groups = new Map<string, { name: string; rows: (string | number)[][] }>();
    for (const s of students) {
      const memberships =
        s.studentBatches.length > 0
          ? s.studentBatches.map((sb: StudentRow["studentBatches"][number]) => sb.batch)
          : [{ id: UNASSIGNED_BATCH_KEY, name: "Unassigned" }];
      for (const b of memberships) {
        if (!groups.has(b.id)) groups.set(b.id, { name: b.name, rows: [] });
        groups.get(b.id)!.rows.push(toRow(s, b.name));
      }
    }
    const sorted = Array.from(groups.values()).sort((a, b) => {
      if (a.name === "Unassigned") return 1;
      if (b.name === "Unassigned") return -1;
      return a.name.localeCompare(b.name);
    });
    rows = sorted.flatMap((g) => g.rows);
    title = "Students — All Batches";
    filenameBase = `students-all-batches-${formatISODate(new Date())}`;
  } else if (batchId === UNASSIGNED_BATCH_KEY) {
    rows = students
      .filter((s: StudentRow) => s.studentBatches.length === 0)
      .map((s: StudentRow) => toRow(s, "Unassigned"));
    title = "Students — Unassigned";
    filenameBase = `students-unassigned-${formatISODate(new Date())}`;
  } else {
    const batch = await prisma.batch.findUnique({ where: { id: batchId }, select: { name: true } });
    if (!batch) {
      return NextResponse.json({ error: "Batch not found." }, { status: 404 });
    }
    rows = students
      .filter((s: StudentRow) =>
        s.studentBatches.some(
          (sb: StudentRow["studentBatches"][number]) => sb.batch.id === batchId
        )
      )
      .map((s: StudentRow) => toRow(s, batch.name));
    title = `Students — ${batch.name}`;
    filenameBase = `students-${batch.name.replace(/[^a-z0-9]+/gi, "-")}-${formatISODate(new Date())}`;
  }

  return buildReportResponse(title, headers, rows, format, filenameBase);
}
