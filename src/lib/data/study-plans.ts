import { prisma } from "@/lib/db/prisma";
import { getStudentCourses } from "@/lib/data/attendance";
import { formatISODate, todayUTC } from "@/lib/utils/date";

export interface StudyPlanItem {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  title: string;
  weekLabel: string | null;
  url: string;
  startDate: string | null; // ISO date
  endDate: string | null; // ISO date — once past, hidden from students automatically
  uploadedByName: string;
  createdAt: string;
}

// This project has no migrations pipeline (schema changes are applied by
// hand against the production database), so the study_plans table is
// provisioned lazily here on first real use, with SQL hand-matched to
// exactly what `prisma db push` would generate for the StudyPlan model in
// schema.prisma: same table/column/index/constraint names, same types and
// defaults, quoted and cased exactly as Prisma does by default. Safe to run
// on every call — every statement is idempotent (IF NOT EXISTS / existence
// checks), so once the table (and its columns) exist this is a cheap no-op.
export async function ensureStudyPlanTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "study_plans" (
      "id" TEXT NOT NULL,
      "courseId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "weekLabel" TEXT,
      "url" TEXT NOT NULL,
      "startDate" TIMESTAMP(3),
      "endDate" TIMESTAMP(3),
      "order" INTEGER NOT NULL,
      "uploadedById" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
    )
  `);
  // Table may already exist from before startDate/endDate were added —
  // add them if missing, so older deployments pick up the new columns too.
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "study_plans" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3)`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "study_plans" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3)`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "study_plans_courseId_idx" ON "study_plans"("courseId")`
  );
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'study_plans_courseId_fkey') THEN
        ALTER TABLE "study_plans"
          ADD CONSTRAINT "study_plans_courseId_fkey"
          FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'study_plans_uploadedById_fkey') THEN
        ALTER TABLE "study_plans"
          ADD CONSTRAINT "study_plans_uploadedById_fkey"
          FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `);
}

function toItem(p: {
  id: string;
  courseId: string;
  title: string;
  weekLabel: string | null;
  url: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  course: { code: string; name: string };
  uploadedBy: { name: string | null; email: string };
}): StudyPlanItem {
  return {
    id: p.id,
    courseId: p.courseId,
    courseCode: p.course.code,
    courseName: p.course.name,
    title: p.title,
    weekLabel: p.weekLabel,
    url: p.url,
    startDate: p.startDate ? formatISODate(p.startDate) : null,
    endDate: p.endDate ? formatISODate(p.endDate) : null,
    uploadedByName: p.uploadedBy.name ?? p.uploadedBy.email,
    createdAt: formatISODate(p.createdAt),
  };
}

const STUDY_PLAN_INCLUDE = {
  course: { select: { code: true, name: true } },
  uploadedBy: { select: { name: true, email: true } },
} as const;

/** Admins see everything, including expired plans, so they can still manage them. */
export async function getAllStudyPlansForAdmin(): Promise<StudyPlanItem[]> {
  await ensureStudyPlanTable();
  const plans = await prisma.studyPlan.findMany({
    include: STUDY_PLAN_INCLUDE,
    orderBy: [{ courseId: "asc" }, { order: "asc" }],
  });
  return plans.map(toItem);
}

/**
 * Students only see plans that haven't ended yet — once a plan's end date
 * has passed, it drops out of this list on its own (no deletion needed; the
 * admin's list above is unaffected so plans stay manageable after expiry).
 */
export async function getStudentStudyPlans(studentId: string): Promise<StudyPlanItem[]> {
  const courses = await getStudentCourses(studentId);
  const courseIds = courses.map((c) => c.id);
  if (courseIds.length === 0) return [];

  await ensureStudyPlanTable();
  const plans = await prisma.studyPlan.findMany({
    where: {
      courseId: { in: courseIds },
      // Stays visible through the whole of its end date (both compared at
      // UTC midnight, matching how parseISODate/todayUTC store dates
      // elsewhere) — drops off starting the day after.
      OR: [{ endDate: null }, { endDate: { gte: todayUTC() } }],
    },
    include: STUDY_PLAN_INCLUDE,
    orderBy: [{ courseId: "asc" }, { order: "asc" }],
  });
  return plans.map(toItem);
}
