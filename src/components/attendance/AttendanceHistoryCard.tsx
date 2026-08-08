import { History } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import AttendanceStatusBadge from "@/components/attendance/AttendanceStatusBadge";
import type { AttendanceHistoryRow } from "@/types/attendance";

export default function AttendanceHistoryCard({ rows }: { rows: AttendanceHistoryRow[] }) {
  return (
    <DashboardCard title="Attendance History" icon={History} bodyClassName="p-0">
      {rows.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">No attendance records yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-ink-900/8 divide-y">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap px-5 py-3 text-ink-900/70">{row.date}</td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-ink-900">{row.courseCode}</span>
                    <span className="text-ink-900/50"> — {row.courseName}</span>
                  </td>
                  <td className="px-5 py-3">
                    <AttendanceStatusBadge status={row.status} />
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
