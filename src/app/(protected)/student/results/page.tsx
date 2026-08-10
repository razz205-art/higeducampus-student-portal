import { redirect } from "next/navigation";
import { BookOpen, Target, Percent, Award } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import {
  getInternalResults,
  getMockTestResults,
  getAssignmentResults,
  getSemesterResults,
  getBatchRank,
  getResultsPerformanceTrend,
} from "@/lib/data/results";
import StatCard from "@/components/dashboard/cards/StatCard";
import QuizPerformanceCard from "@/components/progress/QuizPerformanceCard";
import AssignmentResultsCard from "@/components/results/AssignmentResultsCard";
import SemesterResultCard from "@/components/results/SemesterResultCard";
import BatchRankCard from "@/components/results/BatchRankCard";
import ResultsPerformanceChart from "@/components/results/ResultsPerformanceChart";
import ExportButtonGroup from "@/components/attendance/ExportButtonGroup";

export const metadata = { title: "Results" };

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export default async function StudentResultsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "STUDENT" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }
  const studentId = session!.user.id;

  const [internal, mock, assignments, semesters, batchRank, trend] = await Promise.all([
    getInternalResults(studentId, 20),
    getMockTestResults(studentId, 20),
    getAssignmentResults(studentId),
    getSemesterResults(studentId),
    getBatchRank(studentId),
    getResultsPerformanceTrend(studentId, 12),
  ]);

  const latestSemester = semesters[0] ?? null;
  const internalAvg = average(internal.map((r) => r.percentage));
  const mockAvg = average(mock.map((r) => r.percentage));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-xl font-extrabold text-ink-900">Results</h1>
          <p className="mt-1 text-sm text-ink-900/50">
            Internal assessments, mock tests, assignments, and your official semester record.
          </p>
        </div>
        <ExportButtonGroup baseHref="/api/results/report" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Semester %"
          value={latestSemester ? `${latestSemester.percentage.toFixed(1)}%` : "—"}
          icon={Percent}
        />
        <StatCard
          label="Batch Rank"
          value={batchRank ? `#${batchRank.rank}` : "—"}
          icon={Award}
          hint={batchRank ? `of ${batchRank.totalStudents}` : undefined}
        />
        <StatCard label="Internal Avg" value={`${internalAvg}%`} icon={Target} />
        <StatCard label="Mock Test Avg" value={`${mockAvg}%`} icon={BookOpen} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SemesterResultCard result={latestSemester} />
          <ResultsPerformanceChart data={trend} />
          <QuizPerformanceCard
            rows={internal}
            title="Internal Results"
            icon={Target}
            emptyMessage="No internal assessments recorded yet."
          />
          <QuizPerformanceCard
            rows={mock}
            title="Mock Tests"
            icon={BookOpen}
            emptyMessage="No mock test attempts yet."
          />
          <AssignmentResultsCard rows={assignments} />
        </div>

        <div className="space-y-6">
          <BatchRankCard rank={batchRank} />
        </div>
      </div>
    </div>
  );
}
