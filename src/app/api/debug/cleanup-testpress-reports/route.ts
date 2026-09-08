import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";

function isAdmin(role: string | undefined): boolean {
  return role === "ACADEMIC_ADMIN" || role === "SUPER_ADMIN";
}

/**
 * One-time cleanup for the batch of TestReport rows created by the sync
 * route before per-exam timetable matching existed (it briefly synced
 * every Testpress exam unconditionally). Identifies "auto-synced" reports
 * by their fixed passingPercentage fingerprint (60, the sync's default —
 * distinct from whatever an admin would type by hand) combined with being
 * created by the same system admin account the cron job uses, then
 * deletes only the ones that don't currently have a matching timetable
 * exam entry. Reports that DO have a match (like the APDT01 one) are
 * left alone — this only removes the leftover unrestricted-sync noise.
 *
 * Dry-run by default (shows what would be deleted). Add ?confirm=true to
 * actually delete. Delete this file once cleanup is done — it's a
 * one-time utility, not something that should stay on the live site.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(req.url);
  const confirm = url.searchParams.get("confirm") === "true";

  const systemAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN", isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!systemAdmin) {
    return NextResponse.json({ error: "No system admin account found." }, { status: 500 });
  }

  const candidates = await prisma.testReport.findMany({
    where: {
      createdById: systemAdmin.id,
      passingPercentage: 60,
    },
    select: { id: true, title: true, courseId: true, batchId: true },
  });

  const toDelete: { id: string; title: string }[] = [];
  const kept: { id: string; title: string }[] = [];

  for (const report of candidates) {
    const stillMatches = await prisma.timetableSlot.findFirst({
      where: {
        isExam: true,
        topic: { equals: report.title, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (stillMatches) {
      kept.push({ id: report.id, title: report.title });
    } else {
      toDelete.push({ id: report.id, title: report.title });
    }
  }

  if (!confirm) {
    return NextResponse.json({
      dryRun: true,
      wouldDeleteCount: toDelete.length,
      wouldDeleteTitles: toDelete.map((r) => r.title),
      keptCount: kept.length,
      keptTitles: kept.map((r) => r.title),
      note: "Add ?confirm=true to actually delete the 'wouldDelete' reports.",
    });
  }

  const idsToDelete = toDelete.map((r) => r.id);
  const result = await prisma.testReport.deleteMany({
    where: { id: { in: idsToDelete } },
  });

  return NextResponse.json({
    dryRun: false,
    deletedCount: result.count,
    deletedTitles: toDelete.map((r) => r.title),
    keptCount: kept.length,
    keptTitles: kept.map((r) => r.title),
  });
}
