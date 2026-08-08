import { prisma } from "@/lib/db/prisma";
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
  };
}

async function getReadIdSet(userId: string): Promise<Set<string>> {
  const reads = await prisma.notificationRead.findMany({
    where: { userId },
    select: { notificationId: true },
  });
  return new Set(reads.map((r: { notificationId: string }) => r.notificationId));
}

export async function getPinnedNotifications(userId: string): Promise<NotificationItem[]> {
  const readIds = await getReadIdSet(userId);
  const notifications = await prisma.notification.findMany({
    where: { isPinned: true },
    include: {
      createdBy: { select: { name: true, email: true } },
      attachments: true,
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
  const readIds = await getReadIdSet(userId);

  const where: Record<string, unknown> = {};
  if (excludePinned) where.isPinned = false;
  if (category) where.category = category;
  if (filter === "pinned") where.isPinned = true;
  if (search && search.trim()) {
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { body: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  const notifications = await prisma.notification.findMany({
    where,
    include: {
      createdBy: { select: { name: true, email: true } },
      attachments: true,
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
  const [totalCount, readCount] = await Promise.all([
    prisma.notification.count(),
    prisma.notificationRead.count({ where: { userId } }),
  ]);
  return Math.max(totalCount - readCount, 0);
}

/** Lightweight recent list for the notification bell dropdown. */
export async function getRecentSummaries(
  userId: string,
  limit = 6
): Promise<NotificationSummary[]> {
  const readIds = await getReadIdSet(userId);
  const notifications = await prisma.notification.findMany({
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
