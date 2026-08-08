import { GraduationCap } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Badge from "@/components/ui/Badge";
import type { SemesterResultItem } from "@/types/results";

const STATUS_VARIANT: Record<SemesterResultItem["status"], "success" | "danger" | "warning"> = {
  PASS: "success",
  FAIL: "danger",
  PENDING: "warning",
};

export default function SemesterResultCard({ result }: { result: SemesterResultItem | null }) {
  if (!result) {
    return (
      <DashboardCard title="Semester Result" icon={GraduationCap}>
        <p className="py-6 text-center text-sm text-ink-900/45">
          No semester result has been published yet.
        </p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title={`Semester Result — ${result.semesterLabel}`}
      icon={GraduationCap}
      action={<Badge variant={STATUS_VARIANT[result.status]}>{result.status}</Badge>}
    >
      <div className="mb-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-900/45">GPA</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-ink-900">
            {result.gpa.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-900/45">Percentage</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-ink-900">
            {result.percentage.toFixed(1)}%
          </p>
        </div>
      </div>

      {result.courseResults.length > 0 && (
        <div className="border-ink-900/8 overflow-x-auto rounded-sm border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                <th className="px-4 py-2.5 font-medium">Course</th>
                <th className="px-4 py-2.5 font-medium">Marks</th>
                <th className="px-4 py-2.5 font-medium">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-ink-900/8 divide-y">
              {result.courseResults.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-ink-900">{c.courseCode}</span>
                    <span className="text-ink-900/50"> — {c.courseName}</span>
                  </td>
                  <td className="px-4 py-2.5 text-ink-900/70">
                    {c.marksObtained}/{c.maxMarks}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-ink-900">{c.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
