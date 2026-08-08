import { prisma } from "@/lib/db/prisma";
import { getStudentCourses } from "@/lib/data/attendance";
import { formatISODate } from "@/lib/utils/date";

export interface MaterialItem {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  title: string;
  description: string | null;
  type: "DOCUMENT" | "VIDEO" | "LINK";
  url: string;
  uploadedByName: string;
  createdAt: string;
}

function toItem(m: {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  type: "DOCUMENT" | "VIDEO" | "LINK";
  url: string;
  createdAt: Date;
  course: { code: string; name: string };
  uploadedBy: { name: string | null; email: string };
}): MaterialItem {
  return {
    id: m.id,
    courseId: m.courseId,
    courseCode: m.course.code,
    courseName: m.course.name,
    title: m.title,
    description: m.description,
    type: m.type,
    url: m.url,
    uploadedByName: m.uploadedBy.name ?? m.uploadedBy.email,
    createdAt: formatISODate(m.createdAt),
  };
}

const MATERIAL_INCLUDE = {
  course: { select: { code: true, name: true } },
  uploadedBy: { select: { name: true, email: true } },
} as const;

export async function getStudentMaterials(studentId: string): Promise<MaterialItem[]> {
  const courses = await getStudentCourses(studentId);
  const courseIds = courses.map((c) => c.id);
  if (courseIds.length === 0) return [];

  const materials = await prisma.studyMaterial.findMany({
    where: { courseId: { in: courseIds } },
    include: MATERIAL_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return materials.map(toItem);
}

export async function getAllMaterialsForAdmin(): Promise<MaterialItem[]> {
  const materials = await prisma.studyMaterial.findMany({
    include: MATERIAL_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return materials.map(toItem);
}
