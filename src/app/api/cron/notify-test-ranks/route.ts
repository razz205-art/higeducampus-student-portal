import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";

function isAdmin(role: string | undefined): boolean {
  return role === "ACADEMIC_ADMIN" || role === "SUPER_ADMIN";
}

/**
 * Runs nightly at 11:00 PM IST (see vercel.json) and posts one
 * course+batch-scoped notification per TestReport that hasn't been
 * notified yet, listing every student's rank, score, and status. Scoped
 * to the report's own course+batch (same targeting the Notification
 * model already supports elsewhere) so only the relevant students see
 * it. Idempotent via TestReport.notifiedAt — a report is only ever
 * notified once, even if this cron fires more than once on the same
 * report before notifiedAt is set (each report is processed and marked
 * individually, not in a single batch update, to avoid double-sending
 * if the run is interrupted partway through).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const hasValidCronSecret =
    !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!hasValidCronSecret) {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  const systemAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN", isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!systemAdmin) {
    return NextResponse.json({ error: "No active admin account to post notifications as." }, { status: 500 });
  }

  const pendingReports = await prisma.testReport.findMany({
    where: { notifiedAt: null },
    select: {
      id: true,
      title: true,
      testType: true,
      courseId: true,
      batchId: true,
      passingPercentage: true,
      entries: {
        orderBy: { rank: "asc" },
        select: { rank: true, name: true, percentage: true, status: true },
      },
    },
  });

  if (pendingReports.length === 0) {
    return NextResponse.json({ notified: 0, message: "No new test reports to notify." });
  }

  let notified = 0;
  for (const report of pendingReports) {
    if (report.entries.length === 0) continue; // nothing to list yet, skip until entries exist

    const lines = report.entries.map(
      (e) => `${e.rank}. ${e.name} — ${e.percentage.toFixed(1)}% (${e.status === "PASS" ? "Pass" : "Needs Improvement"})`
    );

    await prisma.notification.create({
      data: {
        title: `Results Out: ${report.title}`,
        body: `Rank list for "${report.title}" (${report.testType}):\n\n${lines.join("\n")}`,
        category: "EXAM_UPDATE",
        courseId: report.courseId,
        batchId: report.batchId,
        createdById: systemAdmin.id,
      },
    });

    await prisma.testReport.update({
      where: { id: report.id },
      data: { notifiedAt: new Date() },
    });

    notified += 1;
  }

  return NextResponse.json({ notified, totalPending: pendingReports.length });
}
