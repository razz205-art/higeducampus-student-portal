"use client";

import { useState } from "react";
import { Layers, ChevronDown } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import LessonChecklist from "@/components/progress/LessonChecklist";
import type { ModuleProgressItem } from "@/types/progress";

export default function ModuleProgressCard({ modules }: { modules: ModuleProgressItem[] }) {
  const [openId, setOpenId] = useState<string | null>(modules[0]?.id ?? null);

  return (
    <DashboardCard title="Module Progress" icon={Layers}>
      {modules.length === 0 ? (
        <p className="text-center text-sm text-ink-900/45">
          No modules published for this course yet.
        </p>
      ) : (
        <ul className="divide-ink-900/8 divide-y">
          {modules.map((m) => {
            const isOpen = openId === m.id;
            return (
              <li key={m.id} className="py-3 first:pt-0 last:pb-0">
                <button
                  onClick={() => setOpenId(isOpen ? null : m.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-ink-900">{m.title}</span>
                      <span className="shrink-0 text-ink-900/60">
                        {m.completedLessons}/{m.totalLessons} · {m.percentage}%
                      </span>
                    </div>
                    <div className="bg-ink-900/8 h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full bg-gold-500"
                        style={{ width: `${m.percentage}%` }}
                      />
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-ink-900/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div className="mt-3 pl-1">
                    <LessonChecklist lessons={m.lessons} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
