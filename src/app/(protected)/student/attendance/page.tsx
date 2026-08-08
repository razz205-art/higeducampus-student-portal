import { redirect } from "next/navigation";
import { CalendarCheck2, UserX, Umbrella, Percent } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import {
  getStudentCourses,
  getStudentAttendanceSummary,
  getStudentCalendarMonth,
  getStudentAttendanceHistory,
  getStudentAttendanceTrend,
  getStudentCourseWiseAttendance,
} from "@/lib/data/attendance";
import { todayUTC } from "@/lib/utils/date";
import StatCard from "@/components/dashboard/cards/StatCard";
import AttendanceFilterBar from "@/components/attendance/AttendanceFilterBar";
import MonthlyAttendanceCalendar from "@/components/attendance/MonthlyAttendanceCalendar";
import AttendanceTrendChart from "@/components/attendance/AttendanceTrendChart";
import AttendanceHistoryCard from "@/components/attendance/AttendanceHistoryCard";
import CourseWiseAttendanceCard from "@/components/attendance/CourseWiseAttendanceCard";
import ExportButtonGroup from "@/components/attendance/ExportButtonGroup";

export const metadata = { title: "Attendance" };

export default async function StudentAttendancePage({
  searchParams,
}: {
  searchParams: { courseId?: string; month?: string; date?: string };
}) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "STUDENT" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }
  const studentId = session!.user.id;

  const courses = await getStudentCourses(studentId);
  const courseId =
    searchParams.courseId && courses.some((c) => c.id === searchParams.courseId)
      ? searchParams.courseId
      : undefined;

  const today = todayUTC();
  let year = today.getUTCFullYear();
  let monthIndex = today.getUTCMonth();
  if (searchParams.month && /^\d{4}-\d{2}$/.test(searchParams.month)) {
    const [y, m] = searchParams.month.split("-").map(Number);
    year = y!;
    monthIndex = m! - 1;
  }

  const [summary, calendarDays, history, trend, courseWise] = await Promise.all([
    getStudentAttendanceSummary(studentId, courseId),
    getStudentCalendarMonth(studentId, year, monthIndex, courseId),
    getStudentAttendanceHistory(studentId, 20, courseId, searchParams.date),
    getStudentAttendanceTrend(studentId, 6, courseId),
    getStudentCourseWiseAttendance(studentId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <AttendanceFilterBar
          action="/student/attendance"
          courses={courses}
          selectedCourseId={courseId}
        />
        <ExportButtonGroup baseHref="/api/attendance/report" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Attendance %" value={`${summary.percentage}%`} icon={Percent} />
        <StatCard label="Present" value={String(summary.present)} icon={CalendarCheck2} />
        <StatCard label="Absent" value={String(summary.absent)} icon={UserX} />
        <StatCard label="Leave" value={String(summary.leave)} icon={Umbrella} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MonthlyAttendanceCalendar
          year={year}
          monthIndex={monthIndex}
          days={calendarDays}
          basePath="/student/attendance"
          courseId={courseId}
        />
        <AttendanceTrendChart data={trend} />
      </div>

      <CourseWiseAttendanceCard rows={courseWise} />

      <div>
        <form
          method="GET"
          action="/student/attendance"
          className="mb-3 flex flex-wrap items-end gap-3"
        >
          {courseId && <input type="hidden" name="courseId" value={courseId} />}
          <div>
            <label htmlFor="date" className="mb-1 block text-xs font-medium text-ink-900/60">
              Search attendance by date
            </label>
            <input
              id="date"
              type="date"
              name="date"
              defaultValue={searchParams.date ?? ""}
              className="rounded-sm border border-ink-900/15 bg-white px-3 py-2 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-sm bg-ink-900 px-4 py-2 text-sm font-medium text-parchment-50 hover:bg-ink-800"
          >
            Search
          </button>
          {searchParams.date && (
            <a
              href={`/student/attendance${courseId ? `?courseId=${courseId}` : ""}`}
              className="text-xs font-medium text-ink-900/50 underline hover:text-ink-900"
            >
              Clear
            </a>
          )}
        </form>
        <AttendanceHistoryCard rows={history} />
      </div>
    </div>
  );
}
