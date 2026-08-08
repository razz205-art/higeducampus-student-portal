import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarRange } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import { formatMonthLabel, toDateOnlyUTC } from "@/lib/utils/date";
import type { CalendarDay } from "@/types/timetable";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TimetableMonthCalendar({
  year,
  monthIndex,
  days,
  basePath,
  selectedDate,
}: {
  year: number;
  monthIndex: number;
  days: CalendarDay[];
  basePath: string;
  selectedDate?: string;
}) {
  const firstOfMonth = toDateOnlyUTC(year, monthIndex, 1);
  const leadingBlanks = firstOfMonth.getUTCDay();

  function monthHref(delta: number) {
    const target = toDateOnlyUTC(year, monthIndex + delta, 1);
    const month = `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}`;
    return `${basePath}?view=calendar&month=${month}`;
  }

  return (
    <DashboardCard
      title="Calendar View"
      icon={CalendarRange}
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
          const isSelected = day.date === selectedDate;
          const hasClasses = day.classCount > 0;
          return (
            <Link
              key={day.date}
              href={`${basePath}?view=calendar&month=${year}-${String(monthIndex + 1).padStart(2, "0")}&date=${day.date}`}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-sm text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-ink-900 text-parchment-50"
                  : hasClasses
                    ? "text-gold-700 bg-gold-500/15 hover:bg-gold-500/25"
                    : "text-ink-900/30 hover:bg-ink-900/5"
              }`}
            >
              {dayNumber}
              {hasClasses && (
                <span
                  className={`h-1 w-1 rounded-full ${isSelected ? "bg-parchment-50" : "bg-gold-600"}`}
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </DashboardCard>
  );
}
