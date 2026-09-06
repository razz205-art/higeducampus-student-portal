import { ClipboardList, CheckCircle2, TrendingUp } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Badge from "@/components/ui/Badge";
import type { StudentTestReportRow } from "@/types/test-reports";

function Row({ row }: { row: StudentTestReportRow }) {
  return (
    <div className="rounded-sm border border-ink-900/10 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-ink-900">{row.title}</p>
          <p className="mt-0.5 text-xs text-ink-900/45">{row.createdAt}</p>
        </div>
        <Badge variant={row.status === "PASS" ? "success" : "warning"}>
          {row.status === "PASS" ? (
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
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-900/40">Rank</p>
          <p className="mt-0.5 font-serif text-lg font-semibold text-ink-900">
            {row.rank}
            <span className="text-sm font-normal text-ink-900/40"> / {row.totalStudents}</span>
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-900/40">Score</p>
          <p className="mt-0.5 font-serif text-lg font-semibold text-ink-900">{row.percentage}%</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-900/40">Correct</p>
          <p className="mt-0.5 font-serif text-lg font-semibold text-signal-success">
            {row.correct ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-900/40">Incorrect</p>
          <p className="mt-0.5 font-serif text-lg font-semibold text-signal-error">
            {row.incorrect ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-900/40">Time</p>
          <p className="mt-0.5 font-serif text-lg font-semibold text-ink-900">
            {row.timeRaw ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StudentTestReportsView({ rows }: { rows: StudentTestReportRow[] }) {
  return (
    <DashboardCard title="My Results" icon={ClipboardList} bodyClassName="p-0">
      {rows.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">
          No test results published for you yet.
        </p>
      ) : (
        <div className="space-y-3 p-5">
          {rows.map((r) => (
            <Row key={r.testReportId} row={r} />
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
