import { PlayCircle } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { RecordingStats } from "@/types/timetable";

export default function RecordingProgressCard({ stats }: { stats: RecordingStats }) {
  return (
    <DashboardCard title="Recorded Sessions" icon={PlayCircle}>
      {stats.totalRecordings === 0 ? (
        <p className="py-6 text-center text-sm text-ink-900/45">
          No recorded sessions assigned yet.
        </p>
      ) : (
        <>
          <div className="flex items-end justify-between">
            <p className="font-serif text-2xl font-semibold text-ink-900">
              {stats.watchedRecordings}
              <span className="text-base font-normal text-ink-900/40">
                {" "}
                / {stats.totalRecordings} watched
              </span>
            </p>
            <p className="text-sm font-medium text-ink-900/60">{stats.percentage}%</p>
          </div>

          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-900/10">
            <div
              className="h-full rounded-full bg-gold-500 transition-all"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>

          {stats.perCourse.length > 1 && (
            <div className="mt-4 space-y-2 border-t border-ink-900/8 pt-3">
              {stats.perCourse.map((c) => (
                <div
                  key={c.courseId}
                  className="flex items-center justify-between gap-3 text-xs text-ink-900/60"
                >
                  <span className="truncate">
                    {c.courseCode} — {c.courseName}
                  </span>
                  <span className="shrink-0 font-medium text-ink-900">
                    {c.watched}/{c.total}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardCard>
  );
}
