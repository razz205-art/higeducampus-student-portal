import {
  todayUTC,
  addDaysUTC,
  getWeekStartUTC,
  formatISODate,
  parseISODate,
} from "@/lib/utils/date";
import { projectDay, projectWeek, projectMonthCounts } from "@/lib/data/timetable";
import TimetableViewTabs from "@/components/timetable/TimetableViewTabs";
import TimetableDayList from "@/components/timetable/TimetableDayList";
import TimetableWeekGrid from "@/components/timetable/TimetableWeekGrid";
import TimetableMonthCalendar from "@/components/timetable/TimetableMonthCalendar";
import type { TimetableSlotItem } from "@/types/timetable";

export default function TimetableView({
  basePath,
  slots,
  searchParams,
  subtitle,
}: {
  basePath: string;
  slots: TimetableSlotItem[];
  searchParams: { view?: string; month?: string; date?: string };
  subtitle: string;
}) {
  const view = searchParams.view ?? "today";
  const today = todayUTC();

  let body: React.ReactNode;

  if (view === "tomorrow") {
    const date = addDaysUTC(today, 1);
    body = (
      <TimetableDayList
        title="Tomorrow's Classes"
        date={formatISODate(date)}
        classes={projectDay(slots, date)}
      />
    );
  } else if (view === "week") {
    body = <TimetableWeekGrid days={projectWeek(slots, getWeekStartUTC(today))} />;
  } else if (view === "nextweek") {
    body = <TimetableWeekGrid days={projectWeek(slots, addDaysUTC(getWeekStartUTC(today), 7))} />;
  } else if (view === "calendar") {
    let year = today.getUTCFullYear();
    let monthIndex = today.getUTCMonth();
    if (searchParams.month && /^\d{4}-\d{2}$/.test(searchParams.month)) {
      const [y, m] = searchParams.month.split("-").map(Number);
      year = y!;
      monthIndex = m! - 1;
    }
    const monthCounts = projectMonthCounts(slots, year, monthIndex);
    body = (
      <div className="space-y-6">
        <TimetableMonthCalendar
          year={year}
          monthIndex={monthIndex}
          days={monthCounts}
          basePath={basePath}
          selectedDate={searchParams.date}
        />
        {searchParams.date && (
          <TimetableDayList
            title="Classes on this day"
            date={searchParams.date}
            classes={projectDay(slots, parseISODate(searchParams.date))}
          />
        )}
      </div>
    );
  } else {
    // "today" (default)
    body = (
      <TimetableDayList
        title="Today's Classes"
        date={formatISODate(today)}
        classes={projectDay(slots, today)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-semibold text-ink-900">Timetable</h1>
        <p className="mt-1 text-sm text-ink-900/50">{subtitle}</p>
      </div>
      <TimetableViewTabs basePath={basePath} active={view} />
      {body}
    </div>
  );
}
