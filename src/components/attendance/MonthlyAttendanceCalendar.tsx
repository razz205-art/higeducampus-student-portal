import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import { formatMonthLabel, toDateOnlyUTC } from "@/lib/utils/date";
import type { CalendarDay } from "@/types/attendance";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_CELL_CLASSES: Record<string, string> = {
  PRESENT: "bg-signal-success/15 text-signal-success",
  ABSENT: "bg-signal-error/15 text-signal-error",
  LEAVE: "bg-gold-500/15 text-gold-600",
};

export default function MonthlyAttendanceCalendar({
  year,
  monthIndex,
  days,
  basePath,
  courseId,
}: {
  year: number;
  monthIndex: number;
  days: CalendarDay[];
  /** Page path to build prev/next links against, e.g. "/student/attendance" */
  basePath: string;
  courseId?: string;
}) {
  const firstOfMonth = toDateOnlyUTC(year, monthIndex, 1);
  const leadingBlanks = firstOfMonth.getUTCDay();

  function monthHref(delta: number) {
    const target = toDateOnlyUTC(year, monthIndex + delta, 1);
    const month = `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}`;
    const params = new URLSearchParams({ month });
    if (courseId) params.set("courseId", courseId);
    return `${basePath}?${params.toString()}`;
  }

  return (
    <DashboardCard
      title="Monthly Calendar"
      icon={CalendarDays}
      action={
        <div className="flex items-center gap-1">
          <Link
            href={monthHref(-1)}
            aria-label="Previous month"
            className="rounded-sm p-1.5 text-ink-900/60 transition-colors hover:bg-ink-900/5 hover:text-ink-900"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </Link>
          <span className="min-w-[7rem] text-center text-sm font-medium text-ink-900">
            {formatMonthLabel(firstOfMonth)}
          </span>
          <Link
            href={monthHref(1)}
            aria-label="Next month"
            className="rounded-sm p-1.5 text-ink-900/60 transition-colors hover:bg-ink-900/5 hover:text-ink-900"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-[11px] font-medium uppercase tracking-wide text-ink-900/40"
          >
            {label}
          </div>
        ))}

        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {days.map((day) => {
          const dayNumber = Number(day.date.slice(-2));
          const cellClass = day.status ? STATUS_CELL_CLASSES[day.status] : "text-ink-900/30";
          return (
            <div
              key={day.date}
              title={day.status ?? "No record"}
              className={`flex aspect-square items-center justify-center rounded-sm text-xs font-medium ${cellClass}`}
            >
              {dayNumber}
            </div>
          );
        })}
      </div>

      <div className="border-ink-900/8 mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t pt-3 text-xs text-ink-900/50">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-signal-success/60" /> Present
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-signal-error/60" /> Absent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-gold-500/60" /> Leave
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-ink-900/10" /> No record
        </span>
      </div>
    </DashboardCard>
  );
}
