import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import {
  getAdminCourseOverview,
  getAdminStudentRowsForCourse,
  getRecentCourseRecords,
  getAllLiveSessionsForAdmin,
  getAllCourses,
} from "@/lib/data/attendance";
import { getQuickRangePresets } from "@/lib/utils/date";
import AdminCourseOverviewTable from "@/components/attendance/AdminCourseOverviewTable";
import AdminStudentAttendanceTable from "@/components/attendance/AdminStudentAttendanceTable";
import AdminRecentRecordsEditor from "@/components/attendance/AdminRecentRecordsEditor";
import AdminSessionControlTable from "@/components/attendance/AdminSessionControlTable";
import ExportButtonGroup from "@/components/attendance/ExportButtonGroup";

export const metadata = { title: "Attendance Management" };

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: { courseId?: string; range?: string };
}) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const [courseOverview, allCourses, liveSessions] = await Promise.all([
    getAdminCourseOverview(),
    getAllCourses(),
    getAllLiveSessionsForAdmin(),
  ]);

  const selectedCourse = allCourses.find((c) => c.id === searchParams.courseId);
  const presets = getQuickRangePresets();
  const activePresetKey = (searchParams.range as (typeof presets)[number]["key"]) ?? undefined;
  const selectedPreset = presets.find((p) => p.key === activePresetKey);
  const range = selectedPreset ? { from: selectedPreset.from, to: selectedPreset.to } : undefined;

  const [studentRows, recentRecords] = selectedCourse
    ? await Promise.all([
        getAdminStudentRowsForCourse(selectedCourse.id, range),
        getRecentCourseRecords(selectedCourse.id, 40, range),
      ])
    : [null, null];

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-serif text-lg font-semibold text-ink-900">Attendance Sessions</h2>
        <p className="text-sm text-ink-900/50">
          Only one session may be active at a time. Activating a session opens the permanent
          attendance link at{" "}
          <code className="rounded-sm bg-ink-900/5 px-1.5 py-0.5">/attendance</code> for enrolled
          (and, if set, matching-batch) students.
        </p>
        <AdminSessionControlTable sessions={liveSessions} />
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-lg font-semibold text-ink-900">
          Course Attendance Overview
        </h2>
        <AdminCourseOverviewTable rows={courseOverview} />
      </section>

      {selectedCourse && studentRows && recentRecords && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-lg font-semibold text-ink-900">
              {selectedCourse.code} — {selectedCourse.name}
            </h2>
            <ExportButtonGroup
              baseHref={`/api/attendance/report/course?courseId=${selectedCourse.id}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-900/40">
              Report period
            </span>
            <a
              href={`?courseId=${selectedCourse.id}`}
              className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors ${
                !activePresetKey
                  ? "border-ink-900 bg-ink-900 text-parchment-50"
                  : "border-ink-900/15 text-ink-900/60 hover:bg-ink-900/5"
              }`}
            >
              All time
            </a>
            {presets.map((p) => (
              <a
                key={p.key}
                href={`?courseId=${selectedCourse.id}&range=${p.key}`}
                className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activePresetKey === p.key
                    ? "border-ink-900 bg-ink-900 text-parchment-50"
                    : "border-ink-900/15 text-ink-900/60 hover:bg-ink-900/5"
                }`}
              >
                {p.label}
              </a>
            ))}
          </div>

          <AdminStudentAttendanceTable rows={studentRows} />
          <AdminRecentRecordsEditor records={recentRecords} />
        </section>
      )}
    </div>
  );
}
