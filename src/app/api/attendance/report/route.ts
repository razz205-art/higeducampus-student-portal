import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { formatISODate } from "@/lib/utils/date";
import { buildReportResponse, parseFormat, checkReportRateLimit } from "@/lib/utils/report-export";

/**
 * Downloads the signed-in STUDENT's own full attendance history.
 * Deliberately ignores any studentId the caller might try to pass — a
 * student can only ever export their own record, never someone else's.
 * ?format=csv|xlsx|pdf (defaults to csv).
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (session.user.role !== "STUDENT" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const rateLimitError = checkReportRateLimit(session.user.id);
  if (rateLimitError) {
    return NextResponse.json({ error: rateLimitError.retryMessage }, { status: 429 });
  }

  const format = parseFormat(req.nextUrl.searchParams.get("format"));

  const records = await prisma.attendanceRecord.findMany({
    where: { studentId: session.user.id },
    include: { course: { select: { code: true, name: true } } },
    orderBy: { date: "desc" },
  });

  const headers = ["Date", "Course Code", "Course Name", "Status"];
  const rows = records.map(
    (r: { date: Date; course: { code: string; name: string }; status: string }) => [
      formatISODate(r.date),
      r.course.code,
      r.course.name,
      r.status,
    ]
  );
  const filenameBase = `attendance-report-${formatISODate(new Date())}`;

  return buildReportResponse("Attendance Report", headers, rows, format, filenameBase);
}
