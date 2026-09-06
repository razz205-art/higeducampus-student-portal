import { Trophy, CheckCircle2, TrendingUp, ChevronRight } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Badge from "@/components/ui/Badge";
import { formatTimeRaw } from "@/lib/utils/date";
import { TEST_REPORT_TYPES } from "@/types/test-reports";
import type { TestReportDetail } from "@/types/test-reports";

function typeLabel(t: TestReportDetail["testType"]): string {
  return TEST_REPORT_TYPES.find((x) => x.value === t)?.label ?? t;
}

function ReportRankings({
  report,
  currentStudentId,
}: {
  report: TestReportDetail;
  currentStudentId: string;
}) {
  const own = report.entries.find((e) => e.studentId === currentStudentId);

  return (
    <details className="group border-ink-900/8 border-b last:border-b-0">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-5 py-3.5 hover:bg-ink-900/[0.02] [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <ChevronRight
            size={14}
            className="shrink-0 text-ink-900/40 transition-transform duration-150 group-open:rotate-90"
            aria-hidden="true"
          />
          <span>
            <span className="font-medium text-ink-900">{report.title}</span>
            <span className="ml-2 rounded-sm bg-ink-900/5 px-1.5 py-0.5 text-xs text-ink-900/60">
              {typeLabel(report.testType)}
            </span>
            <span className="ml-2 text-xs text-ink-900/45">{report.createdAt}</span>
          </span>
        </span>
        <span className="flex items-center gap-3 text-xs text-ink-900/50">
          {own && <span>Your rank: {own.rank} / {report.totalStudents}</span>}
          <span className="text-ink-900/30">·</span>
          <span>Avg {report.averagePercentage}%</span>
          <span className="text-ink-900/30">·</span>
          <span>Top {report.highestPercentage}%</span>
        </span>
      </summary>

      <div className="overflow-x-auto bg-ink-900/[0.015]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
              <th className="px-5 py-2.5 font-medium">Rank</th>
              <th className="px-5 py-2.5 font-medium">Name</th>
              <th className="px-5 py-2.5 font-medium">Score (%)</th>
              <th className="px-5 py-2.5 font-medium">Correct</th>
              <th className="px-5 py-2.5 font-medium">Incorrect</th>
              <th className="px-5 py-2.5 font-medium">Time</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-ink-900/8 divide-y">
            {report.entries.map((e) => {
              const isYou = e.studentId === currentStudentId;
              return (
                <tr key={e.id} className={isYou ? "bg-gold-500/10" : undefined}>
                  <td className="px-5 py-2.5 text-ink-900/50">{e.rank}</td>
                  <td className="px-5 py-2.5 text-ink-900">
                    {e.name}
                    {isYou && (
                      <span className="ml-1.5 rounded-sm bg-gold-500/20 px-1.5 py-0.5 text-xs font-medium text-gold-700">
                        You
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-2.5 font-medium text-ink-900">{e.percentage}%</td>
                  <td className="px-5 py-2.5 text-signal-success">{e.correct ?? "—"}</td>
                  <td className="px-5 py-2.5 text-signal-error">{e.incorrect ?? "—"}</td>
                  <td className="px-5 py-2.5 text-ink-900/60">{formatTimeRaw(e.timeRaw)}</td>
                  <td className="px-5 py-2.5">
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
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default function OverallTestRankings({
  reports,
  currentStudentId,
}: {
  reports: TestReportDetail[];
  currentStudentId: string;
}) {
  return (
    <DashboardCard title="Overall Rankings" icon={Trophy} bodyClassName="p-0">
      {reports.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">
          No published tests to compare yet.
        </p>
      ) : (
        <div>
          {reports.map((r) => (
            <ReportRankings key={r.id} report={r} currentStudentId={currentStudentId} />
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
