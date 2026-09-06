"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";
import { ClipboardList, TrendingUp } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { TestTypeProgress as TestTypeProgressData } from "@/types/test-reports";

const CHART_COLOR: Record<string, string> = {
  DAILY: "#3B82F6",
  WEEKLY: "#B98B3E",
  MODULE: "#10B981",
  MOCK: "#8B5CF6",
};

function TypeCard({ progress }: { progress: TestTypeProgressData }) {
  const color = CHART_COLOR[progress.testType] ?? "#B98B3E";
  const gradientId = `progressFill-${progress.testType}`;

  return (
    <div className="rounded-sm border border-ink-900/10 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink-900">{progress.label}</p>
          <p className="mt-0.5 text-xs text-ink-900/45">
            {progress.testsTaken} test{progress.testsTaken === 1 ? "" : "s"} taken
          </p>
        </div>
        {progress.testsTaken > 0 && (
          <span className="font-serif text-xl font-semibold text-ink-900">
            {progress.averagePercentage}%
            <span className="ml-1 text-xs font-normal text-ink-900/40">avg</span>
          </span>
        )}
      </div>

      {progress.testsTaken === 0 ? (
        <p className="mt-4 py-4 text-center text-xs text-ink-900/40">
          No {progress.label.toLowerCase()}s published for you yet.
        </p>
      ) : (
        <>
          <div className="mt-3 h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progress.trend} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" hide />
                <Tooltip
                  contentStyle={{ borderRadius: 4, border: "1px solid #12203D1A", fontSize: 12 }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
                  formatter={(value) => [`${value}%`, "Score"]}
                />
                <Area
                  type="monotone"
                  dataKey="percentage"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-ink-900/50">
            <span className="flex items-center gap-1">
              <TrendingUp size={11} aria-hidden="true" />
              Latest: {progress.latestPercentage}%
            </span>
            <span>Pass rate: {progress.passRate}%</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function TestTypeProgress({ data }: { data: TestTypeProgressData[] }) {
  return (
    <DashboardCard title="Progress by Test Type" icon={ClipboardList}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {data.map((d) => (
          <TypeCard key={d.testType} progress={d} />
        ))}
      </div>
    </DashboardCard>
  );
}
