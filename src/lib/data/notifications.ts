import { prisma } from "@/lib/db/prisma";
import { getStudentCourses, getFacultyCourses } from "@/lib/data/attendance";
import type {
  NotificationItem,
  NotificationSummary,
  NotificationCategory,
  NotificationFilter,
} from "@/types/notification";
import type { AttachmentType } from "@prisma/client";

interface RawNotification {
  id: string;
  title: string;
  body: string;
  category: string;
  isPinned: boolean;
  createdAt: Date;
  createdBy: { name: string | null; email: string };
  attachments: { id: string; type: AttachmentType; url: string; label: string | null }[];
  courseId: string | null;
  course: { code: string; name: string } | null;
  batchId: string | null;
  batch: { name: string } | null;
}

function toItem(n: RawNotification, readIds: Set<string>): NotificationItem {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    category: n.category as NotificationCategory,
    isPinned: n.isPinned,
    createdAt: n.createdAt.toISOString(),
    createdByName: n.createdBy.name ?? n.createdBy.email,
    attachments: n.attachments,
    isRead: readIds.has(n.id),
    courseId: n.courseId,
    courseName: n.course ? `${n.course.code} — ${n.course.name}` : null,
    batchId: n.batchId,
    batchName: n.batch?.name ?? null,
  };
}

async function getReadIdSet(userId: string): Promise<Set<string>> {
  const reads = await prisma.notificationRead.findMany({
    where: { userId },
    select: { notificationId: true },
  });
  return new Set(reads.map((r: { notificationId: string }) => r.notificationId));
}

/**
 * A notification with no courseId/batchId is "general" — visible to
 * everyone, same as every notification worked before targeting existed.
 * Admins always see everything (they manage the whole system). Students
 * see general notifications plus ones targeted at a course they're
 * enrolled in or their own batch. Faculty see general notifications plus
 * ones targeted at a course they teach (primary or co-faculty) —
 * batch-targeted notifications aren't shown to faculty, since batches
 * are a student-grouping concept.
 */
export async function getAudienceWhere(userId: string): Promise<Record<string, unknown>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, batchId: true },
  });
  if (!user) return { courseId: null, batchId: null };

  if (user.role === "ACADEMIC_ADMIN" || user.role === "SUPER_ADMIN") {
    return {};
  }

  const general = { courseId: null, batchId: null };

  if (user.role === "STUDENT") {
    const courses = await getStudentCourses(userId);
    const courseIds = courses.map((c) => c.id);
    return {
      OR: [
        general,
        ...(courseIds.length > 0 ? [{ courseId: { in: courseIds } }] : []),
        ...(user.batchId ? [{ batchId: user.batchId }] : []),
      ],
    };
  }

  // FACULTY
  const courses = await getFacultyCourses(userId);
  const courseIds = courses.map((c) => c.id);
  return {
    OR: [general, ...(courseIds.length > 0 ? [{ courseId: { in: courseIds } }] : [])],
  };
}

export async function getPinnedNotifications(userId: string): Promise<NotificationItem[]> {
  const [readIds, audienceWhere] = await Promise.all([
    getReadIdSet(userId),
    getAudienceWhere(userId),
  ]);
  const notifications = await prisma.notification.findMany({
    where: { AND: [{ isPinned: true }, audienceWhere] },
    include: {
      createdBy: { select: { name: true, email: true } },
      attachments: true,
      course: { select: { code: true, name: true } },
      batch: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return notifications.map((n: RawNotification) => toItem(n, readIds));
}

export interface NotificationQuery {
  search?: string;
  category?: NotificationCategory;
  filter?: NotificationFilter;
  excludePinned?: boolean;
  limit?: number;
}

export async function getNotifications(
  userId: string,
  query: NotificationQuery = {}
): Promise<NotificationItem[]> {
  const { search, category, filter, excludePinned, limit = 50 } = query;
  const [readIds, audienceWhere] = await Promise.all([
    getReadIdSet(userId),
    getAudienceWhere(userId),
  ]);

  const baseFilters: Record<string, unknown> = {};
  if (excludePinned) baseFilters.isPinned = false;
  if (category) baseFilters.category = category;
  if (filter === "pinned") baseFilters.isPinned = true;

  const conditions: Record<string, unknown>[] = [baseFilters, audienceWhere];
  if (search && search.trim()) {
    conditions.push({
      OR: [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { body: { contains: search.trim(), mode: "insensitive" } },
      ],
    });
  }

  const notifications = await prisma.notification.findMany({
    where: { AND: conditions },
    include: {
      createdBy: { select: { name: true, email: true } },
      attachments: true,
      course: { select: { code: true, name: true } },
      batch: { select: { name: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: filter === "unread" ? undefined : limit,
  });

  let items = notifications.map((n: RawNotification) => toItem(n, readIds));

  if (filter === "unread") {
    items = items.filter((i: NotificationItem) => !i.isRead).slice(0, limit);
  }

  return items;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const audienceWhere = await getAudienceWhere(userId);
  const [totalCount, readCount] = await Promise.all([
    prisma.notification.count({ where: audienceWhere }),
    prisma.notificationRead.count({ where: { userId } }),
  ]);
  return Math.max(totalCount - readCount, 0);
}

/** Lightweight recent list for the notification bell dropdown. */
export async function getRecentSummaries(
  userId: string,
  limit = 6
): Promise<NotificationSummary[]> {
  const [readIds, audienceWhere] = await Promise.all([
    getReadIdSet(userId),
    getAudienceWhere(userId),
  ]);
  const notifications = await prisma.notification.findMany({
    where: audienceWhere,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, title: true, category: true, createdAt: true },
  });

  return notifications.map(
    (n: { id: string; title: string; category: string; createdAt: Date }) => ({
      id: n.id,
      title: n.title,
      category: n.category as NotificationCategory,
      createdAt: n.createdAt.toISOString(),
      isRead: readIds.has(n.id),
    })
  );
}
