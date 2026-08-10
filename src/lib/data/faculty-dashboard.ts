import { prisma } from "@/lib/db/prisma";
import { getFacultyTimetableSlots, projectDay } from "@/lib/data/timetable";
import { todayUTC } from "@/lib/utils/date";
import type { ProjectedClass } from "@/types/timetable";

export interface FacultyDashboardData {
  courseCount: number;
  totalStudents: number;
  todaysClasses: ProjectedClass[];
}

export async function getFacultyDashboardData(facultyId: string): Promise<FacultyDashboardData> {
  const [courses, timetableSlots] = await Promise.all([
    prisma.course.findMany({
      where: { facultyId },
      select: { _count: { select: { enrollments: true } } },
    }),
    getFacultyTimetableSlots(facultyId),
  ]);

  const totalStudents = courses.reduce(
    (sum: number, c: { _count: { enrollments: number } }) => sum + c._count.enrollments,
    0
  );

  const todaysClasses = projectDay(timetableSlots, todayUTC());

  return {
    courseCount: courses.length,
    totalStudents,
    todaysClasses,
  };
}
