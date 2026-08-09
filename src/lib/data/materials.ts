import { prisma } from "@/lib/db/prisma";
import { getStudentCourses } from "@/lib/data/attendance";
import { formatISODate } from "@/lib/utils/date";

export interface MaterialItem {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  moduleId: string | null;
  moduleName: string | null;
  moduleOrder: number | null;
  title: string;
  description: string | null;
  type: "DOCUMENT" | "VIDEO" | "LINK";
  url: string;
  fileSize: string | null;
  uploadedByName: string;
  createdAt: string;
}

function toItem(m: {
  id: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  description: string | null;
  type: "DOCUMENT" | "VIDEO" | "LINK";
  url: string;
  fileSize: string | null;
  createdAt: Date;
  course: { code: string; name: string };
  module: { title: string; order: number } | null;
  uploadedBy: { name: string | null; email: string };
}): MaterialItem {
  return {
    id: m.id,
    courseId: m.courseId,
    courseCode: m.course.code,
    courseName: m.course.name,
    moduleId: m.moduleId,
    moduleName: m.module?.title ?? null,
    moduleOrder: m.module?.order ?? null,
    title: m.title,
    description: m.description,
    type: m.type,
    url: m.url,
    fileSize: m.fileSize,
    uploadedByName: m.uploadedBy.name ?? m.uploadedBy.email,
    createdAt: formatISODate(m.createdAt),
  };
}

const MATERIAL_INCLUDE = {
  course: { select: { code: true, name: true } },
  module: { select: { title: true, order: true } },
  uploadedBy: { select: { name: true, email: true } },
} as const;

export async function getStudentMaterials(studentId: string): Promise<MaterialItem[]> {
  const courses = await getStudentCourses(studentId);
  const courseIds = courses.map((c) => c.id);
  if (courseIds.length === 0) return [];

  const materials = await prisma.studyMaterial.findMany({
    where: { courseId: { in: courseIds } },
    include: MATERIAL_INCLUDE,
    orderBy: [{ createdAt: "desc" }],
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

export interface ChapterOption {
  id: string;
  title: string;
  order: number;
}

/** Chapters ("modules") for one course — populates the chapter picker when uploading a material. */
export async function getChaptersForCourse(courseId: string): Promise<ChapterOption[]> {
  const modules = await prisma.module.findMany({
    where: { courseId },
    select: { id: true, title: true, order: true },
    orderBy: { order: "asc" },
  });
  return modules;
}
