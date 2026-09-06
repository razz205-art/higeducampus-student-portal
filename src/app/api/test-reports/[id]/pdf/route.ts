import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getTestReportDetail } from "@/lib/data/test-reports";
import { buildTestReportPdf } from "@/lib/utils/test-report-pdf";
import { checkReportRateLimit } from "@/lib/utils/report-export";
import { TEST_REPORT_TYPES } from "@/types/test-reports";

function isAdmin(role: string | undefined): boolean {
  return role === "ACADEMIC_ADMIN" || role === "SUPER_ADMIN";
}

/**
 * Downloads a single test report as a styled PDF that mirrors the admin
 * detail page's layout (stat cards, Top 5 Performers, full rankings) —
 * distinct from the generic flat-table exporter used by Attendance/
 * Results/Analytics, since this one is meant to look like the screen it
 * was generated from.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

  const report = await getTestReportDetail(params.id);
  if (!report) {
    return NextResponse.json({ error: "Test report not found." }, { status: 404 });
  }

  const typeLabel = TEST_REPORT_TYPES.find((t) => t.value === report.testType)?.label ?? report.testType;
  const buffer = await buildTestReportPdf(report, typeLabel);

  const safeTitle = report.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeTitle}-report.pdf"`,
    },
  });
}
