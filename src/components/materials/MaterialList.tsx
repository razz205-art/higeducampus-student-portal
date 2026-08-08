import { FileText, Video, Link as LinkIcon, Library } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { MaterialItem } from "@/lib/data/materials";

const TYPE_ICON = { DOCUMENT: FileText, VIDEO: Video, LINK: LinkIcon } as const;
const TYPE_LABEL = { DOCUMENT: "Document", VIDEO: "Video", LINK: "Link" } as const;

export default function MaterialList({ materials }: { materials: MaterialItem[] }) {
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
            return (
              <li key={m.id} className="flex items-start gap-3 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-gold-500/10 text-gold-600">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-ink-900 hover:text-gold-600 hover:underline"
                  >
                    {m.title}
                  </a>
                  {m.description && (
                    <p className="mt-0.5 text-xs text-ink-900/50">{m.description}</p>
                  )}
                  <p className="mt-1 text-xs text-ink-900/40">
                    {TYPE_LABEL[m.type]} · {m.courseCode} · {m.createdAt}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
