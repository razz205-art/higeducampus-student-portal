"use client";

import { useState } from "react";
import { FileText, Video, Link as LinkIcon, Library, ExternalLink } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import { getEmbedInfo } from "@/lib/utils/embed";
import type { MaterialItem } from "@/lib/data/materials";

const TYPE_ICON = { DOCUMENT: FileText, VIDEO: Video, LINK: LinkIcon } as const;
const TYPE_LABEL = { DOCUMENT: "Document", VIDEO: "Video", LINK: "Link" } as const;

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

  // Nothing we can embed inline — an ordinary external link is the honest fallback.
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

export default function MaterialList({ materials }: { materials: MaterialItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <DashboardCard title="Study Materials" icon={Library} bodyClassName="p-0">
      {materials.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">
          No study materials have been shared yet.
        </p>
      ) : (
        <ul className="divide-ink-900/8 divide-y">
          {materials.map((m) => {
            const Icon = TYPE_ICON[m.type];
            const isOpen = openId === m.id;
            return (
              <li key={m.id} className="p-4">
                <button
                  onClick={() => setOpenId(isOpen ? null : m.id)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-gold-500/10 text-gold-600">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-ink-900 hover:text-gold-600">
                      {m.title}
                    </span>
                    {m.description && (
                      <p className="mt-0.5 text-xs text-ink-900/50">{m.description}</p>
                    )}
                    <p className="mt-1 text-xs text-ink-900/40">
                      {TYPE_LABEL[m.type]} · {m.courseCode} · {m.createdAt}
                    </p>
                  </div>
                </button>
                {isOpen && <InlinePlayer material={m} />}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
