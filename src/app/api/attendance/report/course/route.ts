import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { formatISODate } from "@/lib/utils/date";
import { buildReportResponse, parseFormat, checkReportRateLimit } from "@/lib/utils/report-export";

/**
 * Downloads every attendance record for one course. Faculty may only
 * export courses they teach; Academic Admin and Super Admin may export any
 * course. ?format=csv|xlsx|pdf (defaults to csv).
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rateLimitError = checkReportRateLimit(session.user.id);
  if (rateLimitError) {
    return NextResponse.json({ error: rateLimitError.retryMessage }, { status: 429 });
  }

  const courseId = req.nextUrl.searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ error: "courseId is required." }, { status: 400 });
  }
  const format = parseFormat(req.nextUrl.searchParams.get("format"));

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, code: true, name: true, facultyId: true },
  });
  if (!course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  const role = session.user.role;
  const isOwningFaculty = role === "FACULTY" && course.facultyId === session.user.id;
  const isAdmin = role === "ACADEMIC_ADMIN" || role === "SUPER_ADMIN";
  if (!isOwningFaculty && !isAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const records = await prisma.attendanceRecord.findMany({
    where: { courseId },
    include: { student: { select: { name: true, email: true } } },
    orderBy: [{ date: "desc" }, { student: { name: "asc" } }],
  });

  const headers = ["Date", "Student Name", "Student Email", "Status"];
  const rows = records.map(
    (r: { date: Date; student: { name: string | null; email: string }; status: string }) => [
      formatISODate(r.date),
      r.student.name ?? "",
      r.student.email,
      r.status,
    ]
  );
  const filenameBase = `${course.code}-attendance-${formatISODate(new Date())}`;

  return buildReportResponse(
    `${course.code} Attendance Report`,
    headers,
    rows,
    format,
    filenameBase
  );
}
