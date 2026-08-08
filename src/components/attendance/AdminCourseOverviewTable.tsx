import Link from "next/link";
import { LayoutList } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { AdminCourseAttendanceRow } from "@/types/attendance";

export default function AdminCourseOverviewTable({ rows }: { rows: AdminCourseAttendanceRow[] }) {
  return (
    <DashboardCard title="Courses" icon={LayoutList} bodyClassName="p-0">
      {rows.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">
          No courses exist yet. Courses are provisioned by an administrator.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Faculty</th>
                <th className="px-5 py-3 font-medium">Enrolled</th>
                <th className="px-5 py-3 font-medium">Avg. Attendance</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-ink-900/8 divide-y">
              {rows.map((row) => (
                <tr key={row.courseId}>
                  <td className="px-5 py-3">
                    <span className="font-medium text-ink-900">{row.code}</span>
                    <span className="text-ink-900/50"> — {row.name}</span>
                  </td>
                  <td className="px-5 py-3 text-ink-900/70">{row.facultyName}</td>
                  <td className="px-5 py-3 text-ink-900/70">{row.enrolledCount}</td>
                  <td className="px-5 py-3 font-medium text-ink-900">{row.averagePercentage}%</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`?courseId=${row.courseId}`}
                      className="text-xs font-medium text-gold-600 hover:underline"
                    >
                      View details
                    </Link>
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
