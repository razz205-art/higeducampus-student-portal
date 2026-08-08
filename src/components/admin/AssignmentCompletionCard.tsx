import { ClipboardCheck } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { AssignmentCompletionRow } from "@/types/analytics";

export default function AssignmentCompletionCard({ rows }: { rows: AssignmentCompletionRow[] }) {
  return (
    <DashboardCard title="Assignment Completion" icon={ClipboardCheck} bodyClassName="p-0">
      {rows.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">No assignments yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Assignments</th>
                <th className="px-5 py-3 font-medium">Submissions</th>
                <th className="px-5 py-3 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-ink-900/8 divide-y">
              {rows.map((r) => (
                <tr key={r.courseId}>
                  <td className="px-5 py-3">
                    <span className="font-medium text-ink-900">{r.courseCode}</span>
                    <span className="text-ink-900/50"> — {r.courseName}</span>
                  </td>
                  <td className="px-5 py-3 text-ink-900/70">{r.totalAssignments}</td>
                  <td className="px-5 py-3 text-ink-900/70">
                    {r.actualSubmissions}/{r.possibleSubmissions}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-ink-900/8 h-1.5 w-16 overflow-hidden rounded-full">
                        <div
                          className="h-full rounded-full bg-gold-500"
                          style={{ width: `${r.completionPercent}%` }}
                        />
                      </div>
                      <span className="font-medium text-ink-900">{r.completionPercent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
