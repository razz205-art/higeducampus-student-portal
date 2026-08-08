import { prisma } from "@/lib/db/prisma";

export interface AdminCourseRow {
  id: string;
  code: string;
  name: string;
  facultyId: string;
  facultyName: string;
  enrolledCount: number;
}

export async function getAllCoursesForAdmin(): Promise<AdminCourseRow[]> {
  const courses = await prisma.course.findMany({
    include: {
      faculty: { select: { name: true, email: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { code: "asc" },
  });

  return courses.map(
    (c: {
      id: string;
      code: string;
      name: string;
      facultyId: string;
      faculty: { name: string | null; email: string };
      _count: { enrollments: number };
    }) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      facultyId: c.facultyId,
      facultyName: c.faculty.name ?? c.faculty.email,
      enrolledCount: c._count.enrollments,
    })
  );
}

export interface FacultyOption {
  id: string;
  name: string;
}

export async function getFacultyOptions(): Promise<FacultyOption[]> {
  const faculty = await prisma.user.findMany({
    where: { role: "FACULTY", isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  return faculty.map((f: { id: string; name: string | null; email: string }) => ({
    id: f.id,
    name: f.name ?? f.email,
  }));
}
