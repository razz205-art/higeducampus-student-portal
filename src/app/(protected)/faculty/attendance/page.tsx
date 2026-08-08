import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import {
  getFacultyCourses,
  getCourseRoster,
  getFacultyLiveSessions,
  getBatches,
} from "@/lib/data/attendance";
import { parseISODate, formatISODate, todayUTC } from "@/lib/utils/date";
import AttendanceFilterBar from "@/components/attendance/AttendanceFilterBar";
import AttendanceEntryForm from "@/components/attendance/AttendanceEntryForm";
import LiveClassSessionForm from "@/components/attendance/LiveClassSessionForm";
import FacultySessionsList from "@/components/attendance/FacultySessionsList";
import ExportButtonGroup from "@/components/attendance/ExportButtonGroup";

export const metadata = { title: "Attendance" };

export default async function FacultyAttendancePage({
  searchParams,
}: {
  searchParams: { courseId?: string; date?: string };
}) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "FACULTY" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }
  const facultyId = session!.user.id;

  const [courses, batches, mySessions] = await Promise.all([
    getFacultyCourses(facultyId),
    getBatches(),
    getFacultyLiveSessions(facultyId),
  ]);

  const courseId =
    searchParams.courseId && courses.some((c) => c.id === searchParams.courseId)
      ? searchParams.courseId
      : courses[0]?.id;

  const date =
    searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date)
      ? searchParams.date
      : formatISODate(todayUTC());

  const roster = courseId ? await getCourseRoster(courseId, parseISODate(date)) : [];

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-serif text-lg font-semibold text-ink-900">Start Live Class</h2>
        <LiveClassSessionForm courses={courses} batches={batches} />
        <FacultySessionsList sessions={mySessions} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-ink-900">Manual Attendance Entry</h2>
          {courseId && (
            <ExportButtonGroup baseHref={`/api/attendance/report/course?courseId=${courseId}`} />
          )}
        </div>

        <AttendanceFilterBar
          action="/faculty/attendance"
          courses={courses}
          selectedCourseId={courseId}
          allowAllCourses={false}
          date={date}
        />

        {courseId ? (
          <AttendanceEntryForm courseId={courseId} date={date} roster={roster} />
        ) : (
          <p className="rounded-sm border border-ink-900/10 bg-white p-5 text-sm text-ink-900/50">
            You aren&rsquo;t assigned to any courses yet — contact an administrator.
          </p>
        )}
      </section>
    </div>
  );
}
