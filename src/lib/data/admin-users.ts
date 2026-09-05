import { prisma } from "@/lib/db/prisma";
import { Role } from "@prisma/client";

export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string;
  isActive: boolean;
  createdAt: string;
  batchNames: string[]; // all batches this student belongs to — empty for faculty
  batchIds: string[]; // same order as batchNames, used to pre-select the edit form
  registrationNumber: string | null;
  courseCount: number; // for faculty: courses taught; for students: enrollments
}

async function listUsers(role: Role, search?: string): Promise<AdminUserRow[]> {
  const users = await prisma.user.findMany({
    where: {
      role,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      registrationNumber: true,
      studentBatches: {
        select: { batch: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { enrollments: true, facultyCourses: true } },
    },
    orderBy: { name: "asc" },
  });

  return users.map(
    (u: {
      id: string;
      name: string | null;
      email: string;
      isActive: boolean;
      createdAt: Date;
      registrationNumber: string | null;
      studentBatches: { batch: { id: string; name: string } }[];
      _count: { enrollments: number; facultyCourses: number };
    }) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString().slice(0, 10),
      batchNames: u.studentBatches.map((sb) => sb.batch.name),
      batchIds: u.studentBatches.map((sb) => sb.batch.id),
      registrationNumber: u.registrationNumber,
      courseCount: role === "STUDENT" ? u._count.enrollments : u._count.facultyCourses,
    })
  );
}

export async function getAllStudents(search?: string): Promise<AdminUserRow[]> {
  return listUsers("STUDENT", search);
}

export async function getAllFaculty(search?: string): Promise<AdminUserRow[]> {
  return listUsers("FACULTY", search);
}
