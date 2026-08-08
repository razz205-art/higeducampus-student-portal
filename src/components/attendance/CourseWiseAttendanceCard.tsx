import { BookMarked } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { AttendanceSummary, CourseOption } from "@/types/attendance";

export default function CourseWiseAttendanceCard({
  rows,
}: {
  rows: (CourseOption & { summary: AttendanceSummary })[];
}) {
  return (
    <DashboardCard title="Course-wise Attendance" icon={BookMarked} bodyClassName="p-0">
      {rows.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">Not enrolled in any courses yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Present</th>
                <th className="px-5 py-3 font-medium">Absent</th>
                <th className="px-5 py-3 font-medium">Leave</th>
                <th className="px-5 py-3 font-medium">%</th>
              </tr>
            </thead>
            <tbody className="divide-ink-900/8 divide-y">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-3">
                    <span className="font-medium text-ink-900">{row.code}</span>
                    <span className="text-ink-900/50"> — {row.name}</span>
                  </td>
                  <td className="px-5 py-3 text-signal-success">{row.summary.present}</td>
                  <td className="px-5 py-3 text-signal-error">{row.summary.absent}</td>
                  <td className="px-5 py-3 text-gold-600">{row.summary.leave}</td>
                  <td className="px-5 py-3 font-medium text-ink-900">{row.summary.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
