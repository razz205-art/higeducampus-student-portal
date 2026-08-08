import { prisma } from "@/lib/db/prisma";
import { Role } from "@prisma/client";

export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string;
  isActive: boolean;
  createdAt: string;
  batchName: string | null;
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
      batch: { select: { name: true } },
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
      batch: { name: string } | null;
      _count: { enrollments: number; facultyCourses: number };
    }) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString().slice(0, 10),
      batchName: u.batch?.name ?? null,
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
