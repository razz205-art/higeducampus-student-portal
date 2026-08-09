"use client";

import { useState } from "react";
import {
  FileText,
  Video,
  Link as LinkIcon,
  Library,
  ExternalLink,
  ChevronDown,
  FolderOpen,
} from "lucide-react";
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
            {material.fileSize ? ` · ${material.fileSize}` : ""} · {material.createdAt}
          </p>
        </div>
      </button>
      {isOpen && <InlinePlayer material={material} />}
    </li>
  );
}

interface Group {
  key: string;
  name: string | null;
  order: number;
  items: MaterialItem[];
}

function ChapterSection({
  group,
  isExpanded,
  onToggleChapter,
  openMaterialId,
  onToggleMaterial,
}: {
  group: Group;
  isExpanded: boolean;
  onToggleChapter: () => void;
  openMaterialId: string | null;
  onToggleMaterial: (id: string) => void;
}) {
  return (
    <div>
      <button
        onClick={onToggleChapter}
        className="flex w-full items-center justify-between gap-3 bg-ink-900/[0.03] px-4 py-3 text-left transition-colors hover:bg-ink-900/[0.05]"
      >
        <span className="flex items-center gap-2.5">
          <FolderOpen size={15} className="text-gold-600" aria-hidden="true" />
          <span className="text-sm font-semibold text-ink-900">
            {group.name ?? "Ungrouped (added before chapters were required)"}
          </span>
          <span className="text-xs text-ink-900/40">
            {group.items.length} item{group.items.length === 1 ? "" : "s"}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-ink-900/40 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {isExpanded && (
        <ul className="divide-ink-900/8 border-ink-900/8 divide-y border-t">
          {group.items.map((m) => (
            <MaterialRow
              key={m.id}
              material={m}
              isOpen={openMaterialId === m.id}
              onToggle={() => onToggleMaterial(m.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MaterialList({ materials }: { materials: MaterialItem[] }) {
  const groupMap = new Map<string, Group>();
  for (const m of materials) {
    const key = m.moduleId ?? UNGROUPED_KEY;
    if (!groupMap.has(key)) {
      groupMap.set(key, { key, name: m.moduleName, order: m.moduleOrder ?? Infinity, items: [] });
    }
    groupMap.get(key)!.items.push(m);
  }
  const groups = Array.from(groupMap.values()).sort((a, b) => a.order - b.order);

  // First chapter open by default so the page isn't empty-looking on load.
  const [expandedKey, setExpandedKey] = useState<string | null>(groups[0]?.key ?? null);
  const [openMaterialId, setOpenMaterialId] = useState<string | null>(null);

  return (
    <DashboardCard title="View Course" icon={Library} bodyClassName="p-0">
      {materials.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">
          No study materials have been shared yet.
        </p>
      ) : (
        <div className="divide-ink-900/8 divide-y">
          {groups.map((group) => (
            <ChapterSection
              key={group.key}
              group={group}
              isExpanded={expandedKey === group.key}
              onToggleChapter={() => {
                setExpandedKey(expandedKey === group.key ? null : group.key);
                setOpenMaterialId(null);
              }}
              openMaterialId={openMaterialId}
              onToggleMaterial={(id) => setOpenMaterialId(openMaterialId === id ? null : id)}
            />
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
