"use client";

import { useState } from "react";
import { CalendarRange, ExternalLink, FolderOpen, ChevronDown } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import { getEmbedInfo } from "@/lib/utils/embed";
import type { StudyPlanItem } from "@/lib/data/study-plans";

function isImageUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp", ".gif"].some((ext) => path.endsWith(ext));
  } catch {
    return false;
  }
}

function PlanPreview({ plan }: { plan: StudyPlanItem }) {
  const embed = getEmbedInfo(plan.url);

  if (isImageUrl(plan.url)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={plan.url}
        alt={plan.title}
        className="mt-3 w-full rounded-sm border border-ink-900/10"
      />
    );
  }

  if (embed.kind === "drive") {
    return (
      <div className="mt-3 aspect-[3/4] w-full overflow-hidden rounded-sm border border-ink-900/10">
        <iframe src={embed.embedUrl} title={plan.title} className="h-full w-full" allowFullScreen />
      </div>
    );
  }

  if (embed.kind === "pdf") {
    return (
      <iframe
        src={embed.url}
        title={plan.title}
        className="mt-3 h-96 w-full rounded-sm border border-ink-900/10"
      />
    );
  }

  return (
    <a
      href={plan.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex items-center gap-1.5 text-sm font-medium text-gold-600 hover:underline"
    >
      <ExternalLink size={13} aria-hidden="true" />
      Open in a new tab
    </a>
  );
}

function PlanRow({
  plan,
  isOpen,
  onToggle,
}: {
  plan: StudyPlanItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="p-4">
      <button onClick={onToggle} className="flex w-full items-start gap-3 text-left">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-gold-500/10 text-gold-600">
          <CalendarRange size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-ink-900 hover:text-gold-600">{plan.title}</span>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-900/40">
            {plan.weekLabel && (
              <span className="rounded-sm bg-gold-500/15 px-1.5 py-0.5 font-medium text-gold-700">
                {plan.weekLabel}
              </span>
            )}
            {plan.createdAt}
          </p>
        </div>
      </button>
      {isOpen && <PlanPreview plan={plan} />}
    </li>
  );
}

interface Group {
  key: string;
  courseCode: string;
  courseName: string;
  items: StudyPlanItem[];
}

function CourseSection({
  group,
  isExpanded,
  onToggleCourse,
  openPlanId,
  onTogglePlan,
}: {
  group: Group;
  isExpanded: boolean;
  onToggleCourse: () => void;
  openPlanId: string | null;
  onTogglePlan: (id: string) => void;
}) {
  return (
    <div>
      <button
        onClick={onToggleCourse}
        className="flex w-full items-center justify-between gap-3 bg-ink-900/[0.03] px-4 py-3 text-left transition-colors hover:bg-ink-900/[0.05]"
      >
        <span className="flex items-center gap-2.5">
          <FolderOpen size={15} className="text-gold-600" aria-hidden="true" />
          <span className="text-sm font-semibold text-ink-900">
            {group.courseCode} — {group.courseName}
          </span>
          <span className="text-xs text-ink-900/40">
            {group.items.length} plan{group.items.length === 1 ? "" : "s"}
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
          {group.items.map((p) => (
            <PlanRow
              key={p.id}
              plan={p}
              isOpen={openPlanId === p.id}
              onToggle={() => onTogglePlan(p.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function StudyPlanList({ plans }: { plans: StudyPlanItem[] }) {
  const groupMap = new Map<string, Group>();
  for (const p of plans) {
    if (!groupMap.has(p.courseId)) {
      groupMap.set(p.courseId, {
        key: p.courseId,
        courseCode: p.courseCode,
        courseName: p.courseName,
        items: [],
      });
    }
    groupMap.get(p.courseId)!.items.push(p);
  }
  const groups = Array.from(groupMap.values()).sort((a, b) => a.courseCode.localeCompare(b.courseCode));

  const [expandedKey, setExpandedKey] = useState<string | null>(groups[0]?.key ?? null);
  const [openPlanId, setOpenPlanId] = useState<string | null>(null);

  return (
    <DashboardCard title="Study Plan" icon={CalendarRange} bodyClassName="p-0">
      {plans.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">No study plans have been shared yet.</p>
      ) : (
        <div className="divide-ink-900/8 divide-y">
          {groups.map((group) => (
            <CourseSection
              key={group.key}
              group={group}
              isExpanded={expandedKey === group.key}
              onToggleCourse={() => {
                setExpandedKey(expandedKey === group.key ? null : group.key);
                setOpenPlanId(null);
              }}
              openPlanId={openPlanId}
              onTogglePlan={(id) => setOpenPlanId(openPlanId === id ? null : id)}
            />
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
