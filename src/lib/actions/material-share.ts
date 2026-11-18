"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const ADMIN_PATH = "/academic-admin/share-materials";

async function requireAdmin() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN")) return null;
  return session.user;
}

export interface ShareActionResult {
  success: boolean;
  message: string;
  token?: string;
}

const extraLinkSchema = z.object({
  title: z.string().trim().min(1, "Each added link needs a title.").max(200),
  url: z
    .string()
    .trim()
    .url("One of the added links isn't a valid web address.")
    .refine((u) => /^https?:\/\//i.test(u), "Links must start with https://"),
  type: z.enum(["DOCUMENT", "VIDEO", "LINK"]),
  description: z.string().trim().max(300).optional(),
});

const createSchema = z.object({
  title: z.string().trim().min(2, "Give the link a title.").max(150),
  note: z.string().trim().max(1000).optional(),
  materialIds: z.array(z.string().min(1)).max(300, "Too many materials for one link."),
  extraLinks: z.array(extraLinkSchema).max(100, "Too many added links.").default([]),
  // "YYYY-MM-DD" — link works through the end of that day (India time).
  expiresOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
});

export async function createShareLinkAction(
  input: z.infer<typeof createSchema>
): Promise<ShareActionResult> {
  const user = await requireAdmin();
  if (!user) return { success: false, message: "You don't have permission to do this." };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { title, note, materialIds, extraLinks, expiresOn } = parsed.data;
  if (materialIds.length === 0 && extraLinks.length === 0) {
    return { success: false, message: "Select a material or add a link first." };
  }

  const uniqueIds = Array.from(new Set(materialIds));
  const found = await prisma.studyMaterial.count({ where: { id: { in: uniqueIds } } });
  if (found !== uniqueIds.length) {
    return {
      success: false,
      message: "Some selected materials no longer exist — refresh and try again.",
    };
  }

  let expiresAt: Date | null = null;
  if (expiresOn) {
    expiresAt = new Date(`${expiresOn}T23:59:59+05:30`);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
      return { success: false, message: "The expiry date must be today or later." };
    }
  }

  // 12 URL-safe characters (72 bits of randomness) — unguessable.
  const token = randomBytes(9).toString("base64url");

  await prisma.materialShareLink.create({
    data: {
      token,
      title,
      note: note || null,
      materialIds: uniqueIds,
      extraLinks: extraLinks.map((x) => ({
        title: x.title,
        url: x.url,
        type: x.type,
        ...(x.description ? { description: x.description } : {}),
      })),
      expiresAt,
      createdById: user.id ?? null,
      createdByName: user.name ?? user.email ?? null,
    },
  });
  revalidatePath(ADMIN_PATH);
  return { success: true, message: "Share link created.", token };
}

const updateSchema = z.object({
  title: z.string().trim().min(2, "Give the link a title.").max(150),
  note: z.string().trim().max(1000).optional(),
  extraLinks: z.array(extraLinkSchema).max(100, "Too many added links."),
  // "" removes the expiry.
  expiresOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal("")),
});

export async function updateShareLinkAction(
  id: string,
  input: z.infer<typeof updateSchema>
): Promise<ShareActionResult> {
  const user = await requireAdmin();
  if (!user) return { success: false, message: "You don't have permission to do this." };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { title, note, extraLinks, expiresOn } = parsed.data;

  const link = await prisma.materialShareLink.findUnique({ where: { id } });
  if (!link) return { success: false, message: "That link no longer exists." };
  if (link.materialIds.length === 0 && extraLinks.length === 0) {
    return { success: false, message: "A link needs at least one item — keep or add a link." };
  }

  let expiresAt: Date | null = null;
  if (expiresOn) {
    expiresAt = new Date(`${expiresOn}T23:59:59+05:30`);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
      return { success: false, message: "The expiry date must be today or later." };
    }
  }

  await prisma.materialShareLink.update({
    where: { id },
    data: {
      title,
      note: note || null,
      expiresAt,
      extraLinks: extraLinks.map((x) => ({
        title: x.title,
        url: x.url,
        type: x.type,
        ...(x.description ? { description: x.description } : {}),
      })),
    },
  });
  revalidatePath(ADMIN_PATH);
  return { success: true, message: "Link updated. The same web address keeps working." };
}

export async function setShareLinkActiveAction(
  id: string,
  isActive: boolean
): Promise<ShareActionResult> {
  const user = await requireAdmin();
  if (!user) return { success: false, message: "You don't have permission to do this." };
  try {
    await prisma.materialShareLink.update({ where: { id }, data: { isActive } });
  } catch {
    return { success: false, message: "That link no longer exists." };
  }
  revalidatePath(ADMIN_PATH);
  return {
    success: true,
    message: isActive ? "Link turned on." : "Link turned off — it no longer opens.",
  };
}

export async function deleteShareLinkAction(id: string): Promise<ShareActionResult> {
  const user = await requireAdmin();
  if (!user) return { success: false, message: "You don't have permission to do this." };
  try {
    await prisma.materialShareLink.delete({ where: { id } });
  } catch {
    return { success: false, message: "That link no longer exists." };
  }
  revalidatePath(ADMIN_PATH);
  return { success: true, message: "Link deleted." };
}
