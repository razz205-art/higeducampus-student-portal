import { prisma } from "@/lib/db/prisma";

/**
 * Public study-material share links — read side.
 *
 * Kept out of the "use server" actions file on purpose: these are plain
 * server functions used by server components, never callable from the
 * browser.
 */

export interface SharedMaterial {
  id: string;
  title: string;
  description: string | null;
  type: "DOCUMENT" | "VIDEO" | "LINK";
  url: string;
  fileSize: string | null;
  courseName: string;
  chapterTitle: string | null;
  chapterOrder: number | null;
}

export interface ExtraLink {
  title: string;
  url: string;
  type: "DOCUMENT" | "VIDEO" | "LINK";
  description?: string;
}

/** Safely reads the stored JSON — ignores anything malformed. */
export function parseExtraLinks(value: unknown): ExtraLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((v) => {
    if (!v || typeof v !== "object") return [];
    const o = v as Record<string, unknown>;
    if (typeof o.title !== "string" || typeof o.url !== "string") return [];
    if (!/^https?:\/\//i.test(o.url)) return [];
    const type = o.type === "VIDEO" || o.type === "DOCUMENT" ? o.type : "LINK";
    return [
      {
        title: o.title,
        url: o.url,
        type,
        description: typeof o.description === "string" && o.description ? o.description : undefined,
      },
    ];
  });
}

export type SharedLinkResult =
  | { status: "ok"; title: string; note: string | null; materials: SharedMaterial[] }
  | { status: "not_found" | "disabled" | "expired" };

/** Resolves a public link and counts the visit. */
export async function getSharedMaterialsByToken(token: string): Promise<SharedLinkResult> {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(token)) return { status: "not_found" };

  const link = await prisma.materialShareLink.findUnique({ where: { token } });
  if (!link) return { status: "not_found" };
  if (!link.isActive) return { status: "disabled" };
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) return { status: "expired" };

  const rows = await prisma.studyMaterial.findMany({
    where: { id: { in: link.materialIds } },
    include: {
      course: { select: { name: true } },
      module: { select: { title: true, order: true } },
    },
  });

  // Keep the admin's chosen order (chapter-grouping happens on the page).
  const byId = new Map(rows.map((m) => [m.id, m]));
  const materials: SharedMaterial[] = link.materialIds
    .map((id) => byId.get(id))
    .filter((m): m is NonNullable<typeof m> => !!m)
    .map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      type: m.type,
      url: m.url,
      fileSize: m.fileSize,
      courseName: m.course.name,
      chapterTitle: m.module?.title ?? null,
      chapterOrder: m.module?.order ?? null,
    }));

  // Links added directly on the share page come after the course materials.
  parseExtraLinks(link.extraLinks).forEach((x, i) => {
    materials.push({
      id: `extra-${i}`,
      title: x.title,
      description: x.description ?? null,
      type: x.type,
      url: x.url,
      fileSize: null,
      courseName: "",
      chapterTitle: null,
      chapterOrder: null,
    });
  });

  // Best-effort view counter; never block the page on it.
  prisma.materialShareLink
    .update({
      where: { id: link.id },
      data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
    })
    .catch(() => {});

  return { status: "ok", title: link.title, note: link.note, materials };
}

export interface ShareLinkSummary {
  id: string;
  token: string;
  title: string;
  note: string | null;
  materialCount: number;
  extraLinkCount: number;
  missingCount: number; // materials deleted since the link was made
  isActive: boolean;
  expiresAt: string | null; // ISO
  viewCount: number;
  lastViewedAt: string | null; // ISO
  createdByName: string | null;
  createdAt: string; // ISO
}

export async function getShareLinksForAdmin(): Promise<ShareLinkSummary[]> {
  const links = await prisma.materialShareLink.findMany({ orderBy: { createdAt: "desc" } });
  const allIds = Array.from(new Set(links.flatMap((l) => l.materialIds)));
  const existing = new Set(
    (
      await prisma.studyMaterial.findMany({
        where: { id: { in: allIds } },
        select: { id: true },
      })
    ).map((m) => m.id)
  );
  return links.map((l) => {
    const present = l.materialIds.filter((id) => existing.has(id)).length;
    return {
      id: l.id,
      token: l.token,
      title: l.title,
      note: l.note,
      materialCount: present,
      extraLinkCount: parseExtraLinks(l.extraLinks).length,
      missingCount: l.materialIds.length - present,
      isActive: l.isActive,
      expiresAt: l.expiresAt?.toISOString() ?? null,
      viewCount: l.viewCount,
      lastViewedAt: l.lastViewedAt?.toISOString() ?? null,
      createdByName: l.createdByName,
      createdAt: l.createdAt.toISOString(),
    };
  });
}
