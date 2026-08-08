import { GraduationCap } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { FacultyPerformanceRow } from "@/types/analytics";

export default function FacultyPerformanceCard({ rows }: { rows: FacultyPerformanceRow[] }) {
  return (
    <DashboardCard title="Faculty Performance" icon={GraduationCap} bodyClassName="p-0">
      {rows.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">No faculty accounts yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                <th className="px-5 py-3 font-medium">Faculty</th>
                <th className="px-5 py-3 font-medium">Courses</th>
                <th className="px-5 py-3 font-medium">Students</th>
                <th className="px-5 py-3 font-medium">Avg. Attendance</th>
                <th className="px-5 py-3 font-medium">Avg. Result</th>
              </tr>
            </thead>
            <tbody className="divide-ink-900/8 divide-y">
              {rows.map((r) => (
                <tr key={r.facultyId}>
                  <td className="px-5 py-3 font-medium text-ink-900">{r.facultyName}</td>
                  <td className="px-5 py-3 text-ink-900/70">{r.courseCount}</td>
                  <td className="px-5 py-3 text-ink-900/70">{r.studentCount}</td>
                  <td className="px-5 py-3 text-ink-900/70">{r.avgAttendancePercent}%</td>
                  <td className="px-5 py-3 text-ink-900/70">{r.avgResultPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
