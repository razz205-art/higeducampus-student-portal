import { prisma } from "@/lib/db/prisma";

export interface AdminBatchRow {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  studentCount: number;
}

export async function getAllBatchesForAdmin(): Promise<AdminBatchRow[]> {
  const batches = await prisma.batch.findMany({
    include: { _count: { select: { students: true } } },
    orderBy: { startYear: "desc" },
  });

  return batches.map(
    (b: {
      id: string;
      name: string;
      startYear: number;
      endYear: number;
      _count: { students: number };
    }) => ({
      id: b.id,
      name: b.name,
      startYear: b.startYear,
      endYear: b.endYear,
      studentCount: b._count.students,
    })
  );
}
