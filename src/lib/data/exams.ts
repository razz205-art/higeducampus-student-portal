import { prisma } from "@/lib/db/prisma";
import type { ExamItem } from "@/types/exam";

function toExamItem(e: {
  id: string;
  title: string;
  description: string | null;
  examDate: Date;
  isActive: boolean;
}): ExamItem {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    examDate: e.examDate.toISOString(),
    isActive: e.isActive,
  };
}

/** Active exams, soonest first — powers the student-facing countdown grid. */
export async function getActiveExams(): Promise<ExamItem[]> {
  const exams = await prisma.exam.findMany({
    where: { isActive: true },
    orderBy: { examDate: "asc" },
  });
  return exams.map(toExamItem);
}

/** Every exam (active + archived), soonest first — powers admin management. */
export async function getAllExamsForAdmin(): Promise<ExamItem[]> {
  const exams = await prisma.exam.findMany({
    orderBy: { examDate: "asc" },
  });
  return exams.map(toExamItem);
}
