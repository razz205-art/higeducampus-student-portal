import { formatDayLabel, parseISODate, todayUTC, formatISODate } from "@/lib/utils/date";
import TimetableClassRow from "@/components/timetable/TimetableClassRow";
import type { ProjectedWeekDay } from "@/lib/data/timetable";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatShortDate(date: Date): string {
  return `${MONTH_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

export default function TimetableWeekGrid({ days }: { days: ProjectedWeekDay[] }) {
  const todayStr = formatISODate(todayUTC());

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
      {days.map((day) => {
        const isToday = day.date === todayStr;
        return (
          <div
            key={day.date}
            className={`rounded-sm border bg-white p-3 ${
              isToday ? "border-gold-500/40" : "border-ink-900/10"
            }`}
          >
            <div className="border-ink-900/8 mb-2.5 border-b pb-2">
              <p className={`text-sm font-semibold ${isToday ? "text-gold-600" : "text-ink-900"}`}>
                {formatDayLabel(parseISODate(day.date))}
              </p>
              <p className="text-xs text-ink-900/40">{formatShortDate(parseISODate(day.date))}</p>
            </div>
            {day.classes.length === 0 ? (
              <p className="py-3 text-center text-xs text-ink-900/35">No classes</p>
            ) : (
              <div className="space-y-2">
                {day.classes.map((c) => (
                  <TimetableClassRow key={c.id} item={c} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
