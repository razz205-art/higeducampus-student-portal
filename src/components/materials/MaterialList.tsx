"use client";

import { useState } from "react";
import { FileText, Video, Link as LinkIcon, Library, ExternalLink } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import { getEmbedInfo } from "@/lib/utils/embed";
import type { MaterialItem } from "@/lib/data/materials";

const TYPE_ICON = { DOCUMENT: FileText, VIDEO: Video, LINK: LinkIcon } as const;
const TYPE_LABEL = { DOCUMENT: "Document", VIDEO: "Video", LINK: "Link" } as const;
const UNGROUPED_KEY = "__ungrouped__";

function InlinePlayer({ material }: { material: MaterialItem }) {
  const embed = getEmbedInfo(material.url);

  if (embed.kind === "youtube" || embed.kind === "drive") {
    return (
      <div className="mt-3 aspect-video w-full overflow-hidden rounded-sm border border-ink-900/10">
        <iframe
          src={embed.embedUrl}
          title={material.title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (embed.kind === "video") {
    return (
      <video controls className="mt-3 max-h-96 w-full rounded-sm border border-ink-900/10">
        <source src={embed.url} />
        Your browser doesn&rsquo;t support embedded video.
      </video>
    );
  }

  if (embed.kind === "pdf") {
    return (
      <iframe
        src={embed.url}
        title={material.title}
        className="mt-3 h-96 w-full rounded-sm border border-ink-900/10"
      />
    );
  }

  return (
    <a
      href={material.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex items-center gap-1.5 text-sm font-medium text-gold-600 hover:underline"
    >
      <ExternalLink size={13} aria-hidden="true" />
      Open in a new tab
    </a>
  );
}

function MaterialRow({
  material,
  isOpen,
  onToggle,
}: {
  material: MaterialItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = TYPE_ICON[material.type];
  return (
    <li className="p-4">
      <button onClick={onToggle} className="flex w-full items-start gap-3 text-left">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-gold-500/10 text-gold-600">
          <Icon size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-ink-900 hover:text-gold-600">
            {material.title}
          </span>
          {material.description && (
            <p className="mt-0.5 text-xs text-ink-900/50">{material.description}</p>
          )}
          <p className="mt-1 text-xs text-ink-900/40">
            {TYPE_LABEL[material.type]}
            {material.fileSize ? ` · ${material.fileSize}` : ""} · {material.courseCode} ·{" "}
            {material.createdAt}
          </p>
        </div>
      </button>
      {isOpen && <InlinePlayer material={material} />}
    </li>
  );
}

export default function MaterialList({ materials }: { materials: MaterialItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const groups = new Map<string, { name: string | null; order: number; items: MaterialItem[] }>();
  for (const m of materials) {
    const key = m.moduleId ?? UNGROUPED_KEY;
    if (!groups.has(key)) {
      groups.set(key, { name: m.moduleName, order: m.moduleOrder ?? Infinity, items: [] });
    }
    groups.get(key)!.items.push(m);
  }
  const sortedGroups = Array.from(groups.values()).sort((a, b) => a.order - b.order);

  return (
    <DashboardCard title="View Course" icon={Library} bodyClassName="p-0">
      {materials.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">
          No study materials have been shared yet.
        </p>
      ) : (
        <div className="divide-ink-900/8 divide-y">
          {sortedGroups.map((group, idx) => (
            <div key={group.name ?? UNGROUPED_KEY + idx}>
              {group.name && (
                <p className="bg-ink-900/[0.02] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-900/50">
                  {group.name}
                </p>
              )}
              <ul className="divide-ink-900/8 divide-y">
                {group.items.map((m) => (
                  <MaterialRow
                    key={m.id}
                    material={m}
                    isOpen={openId === m.id}
                    onToggle={() => setOpenId(openId === m.id ? null : m.id)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
