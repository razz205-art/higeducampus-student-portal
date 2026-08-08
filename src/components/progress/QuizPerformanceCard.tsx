import { Trophy } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Badge from "@/components/ui/Badge";
import type { QuizPerformanceRow } from "@/types/progress";

function variantFor(percentage: number): "success" | "warning" | "danger" {
  if (percentage >= 80) return "success";
  if (percentage >= 50) return "warning";
  return "danger";
}

export default function QuizPerformanceCard({ rows }: { rows: QuizPerformanceRow[] }) {
  return (
    <DashboardCard title="Quiz Performance" icon={Trophy} bodyClassName="p-0">
      {rows.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">No quiz attempts yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                <th className="px-5 py-3 font-medium">Quiz</th>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-ink-900/8 divide-y">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-3 font-medium text-ink-900">{row.quizTitle}</td>
                  <td className="px-5 py-3 text-ink-900/60">{row.courseCode}</td>
                  <td className="px-5 py-3">
                    <Badge variant={variantFor(row.percentage)}>
                      {row.score}/{row.maxScore} ({row.percentage}%)
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-ink-900/60">{row.takenAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
