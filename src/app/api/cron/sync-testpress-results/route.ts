import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";

function isAdmin(role: string | undefined): boolean {
  return role === "ACADEMIC_ADMIN" || role === "SUPER_ADMIN";
}

const TESTPRESS_BASE = "https://login.higeducampus.in";
const SYNC_STATE_KEY = "testpress-attempts";
const DEFAULT_PASSING_PERCENTAGE = 60;

function inferTestType(title: string): "DAILY" | "WEEKLY" | "MODULE" | "MOCK" {
  const t = title.toLowerCase();
  if (t.includes("daily")) return "DAILY";
  if (t.includes("module")) return "MODULE";
  if (t.includes("mock")) return "MOCK";
  if (t.includes("weekly")) return "WEEKLY";
  return "WEEKLY"; // fallback when the title gives no clue
}

type TestpressExam = {
  id: number;
  title: string;
  start_date: string | null;
};

type TestpressAttempt = {
  id: number;
  exam_id: number;
  email: string | null;
  name: string;
  score: string;
  percentage: number;
  correct_answers_count: number;
  incorrect_answers_count: number;
  time_taken: string;
  result: "Pass" | "Fail";
  state: string;
};

async function getTestpressToken(): Promise<string> {
  const username = process.env.TESTPRESS_ADMIN_USERNAME;
  const password = process.env.TESTPRESS_ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error("Missing TESTPRESS_ADMIN_USERNAME / TESTPRESS_ADMIN_PASSWORD env vars.");
  }
  const res = await fetch(`${TESTPRESS_BASE}/api/v2.5/auth-token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`Testpress auth failed: ${res.status}`);
  const data = await res.json();
  if (!data.token) throw new Error("Testpress auth response had no token field.");
  return data.token as string;
}

/**
 * Fetches attempts newest-first, stopping once we cross the last synced
 * watermark. Caps at 10 pages (2000 attempts) per run as a safety limit —
 * if a single night ever produces more than that, later attempts will be
 * picked up on the following run instead of infinitely paginating.
 */
async function fetchNewAttempts(token: string, sinceAttemptId: number): Promise<TestpressAttempt[]> {
  const collected: TestpressAttempt[] = [];
  let url: string | null =
    `${TESTPRESS_BASE}/api/v2.5/admin/attempts/?ordering=-id&page_size=200`;
  let pages = 0;

  while (url && pages < 10) {
    const res: Response = await fetch(url, { headers: { Authorization: `JWT ${token}` } });
    if (!res.ok) throw new Error(`Testpress attempts fetch failed: ${res.status}`);
    const data = await res.json();
    const results: TestpressAttempt[] = data.results ?? [];

    for (const attempt of results) {
      if (attempt.id <= sinceAttemptId) {
        return collected; // hit the watermark — everything after this is already synced
      }
      if (attempt.state === "Completed") {
        collected.push(attempt);
      }
    }

    url = data.next ?? null;
    pages += 1;
  }
  return collected;
}

async function fetchExam(token: string, examId: number): Promise<TestpressExam | null> {
  const res = await fetch(`${TESTPRESS_BASE}/api/v2.5/admin/exams/${examId}/`, {
    headers: { Authorization: `JWT ${token}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as TestpressExam;
}

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
    return NextResponse.json({ error: "No active admin account to attribute synced reports to." }, { status: 500 });
  }

  const syncState = await prisma.testpressSyncState.upsert({
    where: { key: SYNC_STATE_KEY },
    create: { key: SYNC_STATE_KEY, lastAttemptId: 0 },
    update: {},
  });

  const forceResync = req.nextUrl.searchParams.get("resync") === "true";
  const watermark = forceResync ? 0 : syncState.lastAttemptId;

  let token: string;
  try {
    token = await getTestpressToken();
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  let newAttempts: TestpressAttempt[];
  try {
    newAttempts = await fetchNewAttempts(token, watermark);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  if (newAttempts.length === 0) {
    return NextResponse.json({ synced: 0, message: "No new completed attempts since last sync." });
  }

  // Group attempts by exam so we create one TestReport per (exam, batch) pair.
  const byExamId = new Map<number, TestpressAttempt[]>();
  for (const attempt of newAttempts) {
    const list = byExamId.get(attempt.exam_id) ?? [];
    list.push(attempt);
    byExamId.set(attempt.exam_id, list);
  }

  let reportsCreated = 0;
  let entriesCreated = 0;
  const skippedExams: string[] = [];
  const unmatchedEmails: string[] = [];

  for (const [examId, attempts] of byExamId) {
    const exam = await fetchExam(token, examId);
    if (!exam) {
      skippedExams.push(`exam_id ${examId} (fetch failed)`);
      continue;
    }

    // Only sync exams that were explicitly scheduled in the portal's
    // Timetable as a matching exam entry — this is the deliberate
    // "opt-in per exam" control: nothing syncs unless the admin created
    // a matching timetable entry (same title) for it first.
    //
    // Match purely on title (which the admin suffixes with a unique code
    // like "| APDT01" on both Testpress and the timetable topic).
    // Testpress's start_date reflects when the exam was originally
    // created, not when it was actually administered — many exams are
    // standing/reusable tests created years ago — so date-matching is
    // unreliable and intentionally not used here.
    const matchedSlot = await prisma.timetableSlot.findFirst({
      where: {
        isExam: true,
        topic: { equals: exam.title, mode: "insensitive" },
      },
      select: { courseId: true, batchId: true },
    });
    if (!matchedSlot) {
      skippedExams.push(`${exam.title} (no timetable exam entry with matching topic)`);
      continue;
    }

    const matchedCourse = { id: matchedSlot.courseId };
    const fixedBatchId = matchedSlot.batchId; // null = not batch-restricted, group by each student's own batch

    // Resolve each attempt to a student by email, then group by that
    // student's batch — a single exam can span students in different
    // batches, and TestReport requires one batchId per report. Some
    // Testpress attempts have a null email (orphaned/anonymous accounts)
    // and are treated as unmatched rather than crashing the sync.
    const validAttempts = attempts.filter((a) => !!a.email);
    for (const a of attempts) {
      if (!a.email) unmatchedEmails.push(`(no email) attempt #${a.id}`);
    }
    const emails = validAttempts.map((a) => a.email!.toLowerCase());
    const students = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true, batchId: true },
    });
    const studentByEmail = new Map(students.map((s) => [s.email.toLowerCase(), s]));

    const byBatch = new Map<string, { attempt: TestpressAttempt; studentId: string }[]>();
    for (const attempt of validAttempts) {
      const student = studentByEmail.get(attempt.email!.toLowerCase());
      if (!student || !student.batchId) {
        unmatchedEmails.push(attempt.email!);
        continue;
      }
      // If the timetable slot was scoped to a specific batch, only accept
      // attempts from students in that exact batch — others are skipped
      // rather than silently grouped into the wrong report.
      if (fixedBatchId && student.batchId !== fixedBatchId) {
        continue;
      }
      const list = byBatch.get(student.batchId) ?? [];
      list.push({ attempt, studentId: student.id });
      byBatch.set(student.batchId, list);
    }

    for (const [batchId, group] of byBatch) {
      let report = await prisma.testReport.findFirst({
        where: { title: exam.title, courseId: matchedCourse.id, batchId },
        select: { id: true },
      });

      if (!report) {
        report = await prisma.testReport.create({
          data: {
            title: exam.title,
            testType: inferTestType(exam.title),
            courseId: matchedCourse.id,
            batchId,
            passingPercentage: DEFAULT_PASSING_PERCENTAGE,
            createdById: systemAdmin.id,
          },
        });
        reportsCreated += 1;
      } else {
        // Reopen it for the new arrivals — a report that already had a
        // rank-list notification sent should get re-notified once the
        // newly merged students are added.
        await prisma.testReport.update({
          where: { id: report.id },
          data: { notifiedAt: null },
        });
      }

      const reportId: string = report.id;

      // Merge: keep existing entries, skip students who already have one
      // (their first synced attempt stands), add only genuinely new ones.
      const existingEntries = await prisma.testReportEntry.findMany({
        where: { testReportId: reportId },
        select: { id: true, studentId: true, name: true, percentage: true, correct: true, incorrect: true, timeRaw: true, status: true },
      });
      const existingStudentIds = new Set(existingEntries.map((e) => e.studentId).filter(Boolean));

      const newOnes = group.filter((item) => !existingStudentIds.has(item.studentId));
      if (newOnes.length > 0) {
        await prisma.testReportEntry.createMany({
          data: newOnes.map((item) => ({
            testReportId: reportId,
            studentId: item.studentId,
            name: item.attempt.name,
            rank: 0, // placeholder — re-ranked below across the full combined list
            percentage: item.attempt.percentage,
            correct: item.attempt.correct_answers_count,
            incorrect: item.attempt.incorrect_answers_count,
            timeRaw: item.attempt.time_taken,
            status:
              item.attempt.percentage >= DEFAULT_PASSING_PERCENTAGE
                ? "PASS"
                : "NEEDS_IMPROVEMENT",
          })),
        });
        entriesCreated += newOnes.length;
      }

      // Re-rank the full combined set (existing + newly added) by score.
      const allEntries = await prisma.testReportEntry.findMany({
        where: { testReportId: reportId },
        select: { id: true, percentage: true },
        orderBy: { percentage: "desc" },
      });
      await Promise.all(
        allEntries.map((entry, index) =>
          prisma.testReportEntry.update({
            where: { id: entry.id },
            data: { rank: index + 1 },
          })
        )
      );
    }
  }

  const highestAttemptId = Math.max(...newAttempts.map((a) => a.id));
  await prisma.testpressSyncState.update({
    where: { key: SYNC_STATE_KEY },
    data: { lastAttemptId: highestAttemptId },
  });

  return NextResponse.json({
    reportsCreated,
    entriesCreated,
    skippedExams,
    unmatchedEmails,
    newWatermark: highestAttemptId,
  });
}
