import { redirect } from "next/navigation";
import {
  Users,
  GraduationCap,
  BookOpen,
  Percent,
  Award,
  TrendingUp,
} from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import {
  getAdminAnalyticsOverview,
  getInstitutionAttendanceTrend,
  getEnrollmentByBatch,
  getStudentGrowth,
  getCourseCompletionRates,
  getAssignmentCompletionRates,
  getFacultyPerformance,
  getDailyActiveUsers,
  getMonthlyActiveUsers,
} from "@/lib/data/admin-analytics";
import StatCard from "@/components/dashboard/cards/StatCard";
import AttendanceTrendChart from "@/components/attendance/AttendanceTrendChart";
import ActivityChart from "@/components/charts/ActivityChart";
import ExportButtonGroup from "@/components/attendance/ExportButtonGroup";
import PeriodTabs from "@/components/admin/PeriodTabs";
import CourseCompletionCard from "@/components/admin/CourseCompletionCard";
import AssignmentCompletionCard from "@/components/admin/AssignmentCompletionCard";
import FacultyPerformanceCard from "@/components/admin/FacultyPerformanceCard";

export const metadata = { title: "Analytics" };

const DAU_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
];

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: { dau?: string };
}) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const dauDays = ["7", "14", "30"].includes(searchParams.dau ?? "")
    ? Number(searchParams.dau)
    : 14;

  const [
    overview,
    attendanceTrend,
    enrollmentByBatch,
    studentGrowth,
    courseCompletion,
    assignmentCompletion,
    facultyPerformance,
    dau,
    mau,
  ] = await Promise.all([
    getAdminAnalyticsOverview(),
    getInstitutionAttendanceTrend(6),
    getEnrollmentByBatch(),
    getStudentGrowth(6),
    getCourseCompletionRates(),
    getAssignmentCompletionRates(),
    getFacultyPerformance(),
    getDailyActiveUsers(dauDays),
    getMonthlyActiveUsers(6),
  ]);

  const enrollmentActivityPoints = enrollmentByBatch.map((b) => ({
    label: b.batchName,
    count: b.studentCount,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl font-extrabold text-ink-900">Analytics</h1>
          <p className="mt-1 text-sm text-ink-900/50">
            Institution-wide numbers across every module, pulled live — not a snapshot.
          </p>
        </div>
        <ExportButtonGroup baseHref="/api/analytics/report" />
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
        <ActivityChart title="Student Growth" icon="Users" data={studentGrowth} />
        <AttendanceTrendChart data={attendanceTrend} title="Attendance Trend" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-900/70">Daily Active Users</p>
            <PeriodTabs
              basePath="/academic-admin/analytics"
              paramName="dau"
              options={DAU_OPTIONS}
              active={String(dauDays)}
            />
          </div>
          <ActivityChart title="Daily Active Users" icon="Activity" data={dau} />
        </div>
        <ActivityChart title="Monthly Active Users" icon="CalendarRange" data={mau} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CourseCompletionCard rows={courseCompletion} />
        <AssignmentCompletionCard rows={assignmentCompletion} />
      </div>

      <ActivityChart title="Students per Batch" icon="Users" data={enrollmentActivityPoints} />

      <FacultyPerformanceCard rows={facultyPerformance} />
    </div>
  );
}
