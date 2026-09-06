import { Users, TrendingUp, CheckCircle2, Trophy } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Badge from "@/components/ui/Badge";
import TestReportScoreChart from "@/components/results/TestReportScoreChart";
import { formatTimeRaw } from "@/lib/utils/date";
import type { TestReportDetail as TestReportDetailData } from "@/types/test-reports";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border-l-4 border-signal-success bg-white p-4">
      <p className="font-serif text-2xl font-semibold text-ink-900">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-900/45">{label}</p>
    </div>
  );
}

export default function TestReportDetail({ report }: { report: TestReportDetailData }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink-900">{report.title}</h1>
        <p className="mt-1 text-sm text-ink-900/50">{report.courseCode} — {report.courseName} · {report.batchName} · {report.createdAt}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Students" value={String(report.totalStudents)} />
        <StatCard label="Average Score" value={`${report.averagePercentage}%`} />
        <StatCard
          label={`Pass Rate (≥${report.passingPercentage}%)`}
          value={`${report.passRate}%`}
        />
        <StatCard label="Highest Score" value={`${report.highestPercentage}%`} />
      </div>

      <DashboardCard title="Top 5 Performers" icon={Trophy}>
        {report.topPerformers.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-900/45">No students yet.</p>
        ) : (
          <div className="divide-ink-900/8 divide-y">
            {report.topPerformers.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-500/15 text-xs font-semibold text-gold-600">
                    {p.rank}
                  </span>
                  <div>
                    <p className="font-medium text-ink-900">{p.name}</p>
                    <p className="text-xs text-ink-900/45">
                      {p.correct !== null && p.incorrect !== null
                        ? `${p.correct} correct · ${p.incorrect} incorrect`
                        : null}
                      {p.timeRaw ? ` · ${formatTimeRaw(p.timeRaw)}` : null}
                    </p>
                  </div>
                </div>
                <span className="font-serif text-lg font-semibold text-ink-900">
                  {p.percentage}%
                </span>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>

      <TestReportScoreChart data={report.scoreDistribution} />

      <DashboardCard title="Complete Rankings" icon={Users} bodyClassName="p-0">
        {report.entries.length === 0 ? (
          <p className="p-5 text-center text-sm text-ink-900/45">No students yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                  <th className="px-5 py-3 font-medium">Rank</th>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Score (%)</th>
                  <th className="px-5 py-3 font-medium">Correct</th>
                  <th className="px-5 py-3 font-medium">Incorrect</th>
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-ink-900/8 divide-y">
                {report.entries.map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-3 text-ink-900/50">{e.rank}</td>
                    <td className="px-5 py-3 text-ink-900">
                      {e.name}
                      {!e.studentId && (
                        <span className="ml-1.5 text-xs text-ink-900/40">(no linked account)</span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-medium text-ink-900">{e.percentage}%</td>
                    <td className="px-5 py-3 text-signal-success">{e.correct ?? "—"}</td>
                    <td className="px-5 py-3 text-signal-error">{e.incorrect ?? "—"}</td>
                    <td className="px-5 py-3 text-ink-900/60">{formatTimeRaw(e.timeRaw)}</td>
                    <td className="px-5 py-3">
                      <Badge variant={e.status === "PASS" ? "success" : "warning"}>
                        {e.status === "PASS" ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 size={11} aria-hidden="true" />
                            Pass
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <TrendingUp size={11} aria-hidden="true" />
                            Needs Improvement
                          </span>
                        )}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
