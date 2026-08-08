"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export interface ActionResult {
  success: boolean;
  message: string;
}

function isAdmin(role: string | undefined): boolean {
  return role === "ACADEMIC_ADMIN" || role === "SUPER_ADMIN";
}

const CATEGORY_VALUES = [
  "ANNOUNCEMENT",
  "EXAM_UPDATE",
  "SCHEDULE_CHANGE",
  "ASSIGNMENT_REMINDER",
  "FEE_REMINDER",
  "HOLIDAY_NOTICE",
  "PLACEMENT_UPDATE",
] as const;

const attachmentSchema = z.object({
  type: z.enum(["IMAGE", "PDF", "VIDEO"]),
  url: z.string().trim().url("Enter a valid URL."),
  label: z.string().trim().max(120).optional(),
});

const notificationSchema = z.object({
  title: z.string().trim().min(3, "Enter a title.").max(150),
  body: z.string().trim().min(3, "Enter the notification content.").max(5000),
  category: z.enum(CATEGORY_VALUES),
  isPinned: z.boolean().default(false),
  attachments: z.array(attachmentSchema).max(10).default([]),
});

export async function createNotificationAction(
  input: z.infer<typeof notificationSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to post notifications." };
  }

  const parsed = notificationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { title, body, category, isPinned, attachments } = parsed.data;

  await prisma.notification.create({
    data: {
      title,
      body,
      category,
      isPinned,
      createdById: session.user.id,
      attachments: {
        create: attachments.map((a) => ({ type: a.type, url: a.url, label: a.label || null })),
      },
    },
  });

  revalidatePath("/notifications");

  return { success: true, message: "Notification posted." };
}

const updateSchema = notificationSchema.extend({ notificationId: z.string().min(1) });

export async function updateNotificationAction(
  input: z.infer<typeof updateSchema>
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to edit notifications." };
  }

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { notificationId, title, body, category, isPinned, attachments } = parsed.data;

  try {
    await prisma.$transaction([
      prisma.notificationAttachment.deleteMany({ where: { notificationId } }),
      prisma.notification.update({
        where: { id: notificationId },
        data: {
          title,
          body,
          category,
          isPinned,
          attachments: {
            create: attachments.map((a) => ({
              type: a.type,
              url: a.url,
              label: a.label || null,
            })),
          },
        },
      }),
    ]);
  } catch {
    return { success: false, message: "Notification not found or could not be updated." };
  }

  revalidatePath("/notifications");

  return { success: true, message: "Notification updated." };
}

export async function togglePinAction(
  notificationId: string,
  isPinned: boolean
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to pin notifications." };
  }

  try {
    await prisma.notification.update({ where: { id: notificationId }, data: { isPinned } });
  } catch {
    return { success: false, message: "Notification not found." };
  }

  revalidatePath("/notifications");

  return { success: true, message: isPinned ? "Pinned." : "Unpinned." };
}

export async function deleteNotificationAction(notificationId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to delete notifications." };
  }

  try {
    await prisma.notification.delete({ where: { id: notificationId } });
  } catch {
    return { success: false, message: "Notification not found." };
  }

  revalidatePath("/notifications");

  return { success: true, message: "Notification deleted." };
}

// ---------------------------------------------------------------------------
// Read status — any authenticated user, for their own read state only.
// ---------------------------------------------------------------------------

export async function markNotificationReadAction(notificationId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };

  await prisma.notificationRead.upsert({
    where: { userId_notificationId: { userId: session.user.id, notificationId } },
    update: {},
    create: { userId: session.user.id, notificationId },
  });

  revalidatePath("/notifications");

  return { success: true, message: "Marked as read." };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };

  const all = await prisma.notification.findMany({ select: { id: true } });
  await prisma.notificationRead.createMany({
    data: all.map((n: { id: string }) => ({
      userId: session.user.id,
      notificationId: n.id,
    })),
    skipDuplicates: true,
  });

  revalidatePath("/notifications");

  return { success: true, message: "All notifications marked as read." };
}
