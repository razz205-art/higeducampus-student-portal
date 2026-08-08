import { ClipboardList } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Badge from "@/components/ui/Badge";
import type { AssignmentResultRow } from "@/types/results";

export default function AssignmentResultsCard({ rows }: { rows: AssignmentResultRow[] }) {
  return (
    <DashboardCard title="Assignments" icon={ClipboardList} bodyClassName="p-0">
      {rows.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">No assignments submitted yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                <th className="px-5 py-3 font-medium">Assignment</th>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-ink-900/8 divide-y">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-3 font-medium text-ink-900">{row.title}</td>
                  <td className="px-5 py-3 text-ink-900/60">{row.courseCode}</td>
                  <td className="px-5 py-3">
                    {row.status === "GRADED" && row.score !== null ? (
                      <Badge variant={row.score / row.maxScore >= 0.8 ? "success" : "warning"}>
                        {row.score}/{row.maxScore}
                      </Badge>
                    ) : (
                      <Badge variant="info">Submitted</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-ink-900/60">{row.submittedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
