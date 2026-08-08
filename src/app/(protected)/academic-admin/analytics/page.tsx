import { redirect } from "next/navigation";
import { Users, GraduationCap, BookOpen, Percent, Award, TrendingUp } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import {
  getAdminAnalyticsOverview,
  getInstitutionAttendanceTrend,
  getEnrollmentByBatch,
} from "@/lib/data/admin-analytics";
import StatCard from "@/components/dashboard/cards/StatCard";
import AttendanceTrendChart from "@/components/attendance/AttendanceTrendChart";
import ActivityChart from "@/components/charts/ActivityChart";

export const metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const [overview, attendanceTrend, enrollmentByBatch] = await Promise.all([
    getAdminAnalyticsOverview(),
    getInstitutionAttendanceTrend(6),
    getEnrollmentByBatch(),
  ]);

  const enrollmentActivityPoints = enrollmentByBatch.map((b) => ({
    label: b.batchName,
    count: b.studentCount,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-semibold text-ink-900">Analytics</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Institution-wide numbers across every module.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Students" value={String(overview.totalStudents)} icon={Users} />
        <StatCard
          label="Total Faculty"
          value={String(overview.totalFaculty)}
          icon={GraduationCap}
        />
        <StatCard label="Total Courses" value={String(overview.totalCourses)} icon={BookOpen} />
        <StatCard
          label="Avg. Attendance"
          value={`${overview.avgAttendancePercent}%`}
          icon={Percent}
        />
        <StatCard
          label="Avg. Semester Score"
          value={`${overview.avgSemesterPercent}%`}
          icon={TrendingUp}
        />
        <StatCard
          label="Certificates Issued"
          value={String(overview.certificatesIssued)}
          icon={Award}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AttendanceTrendChart data={attendanceTrend} title="Institution-wide Attendance Trend" />
        <ActivityChart title="Students per Batch" icon={Users} data={enrollmentActivityPoints} />
      </div>
    </div>
  );
}
