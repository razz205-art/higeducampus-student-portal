import {
  todayUTC,
  addDaysUTC,
  getWeekStartUTC,
  formatISODate,
  parseISODate,
} from "@/lib/utils/date";
import {
  projectDay,
  projectWeek,
  projectMonthCounts,
  enrichClassesWithCompletions,
} from "@/lib/data/timetable";
import TimetableViewTabs from "@/components/timetable/TimetableViewTabs";
import TimetableDayList from "@/components/timetable/TimetableDayList";
import TimetableWeekGrid from "@/components/timetable/TimetableWeekGrid";
import TimetableMonthCalendar from "@/components/timetable/TimetableMonthCalendar";
import type { TimetableSlotItem, ProjectedClass } from "@/types/timetable";
import type { ProjectedWeekDay } from "@/lib/data/timetable";

// When studentId is provided, every projected class is enriched with that
// student's own join/watch/attend completion state, which turns on the
// self-mark controls in TimetableClassRow. Faculty/admin views omit
// studentId and see the same rows without any marking UI.
async function enrichDay(studentId: string | undefined, classes: ProjectedClass[]) {
  return studentId ? enrichClassesWithCompletions(studentId, classes) : classes;
}

async function enrichWeek(studentId: string | undefined, days: ProjectedWeekDay[]) {
  if (!studentId) return days;
  return Promise.all(
    days.map(async (day) => ({ ...day, classes: await enrichClassesWithCompletions(studentId, day.classes) }))
  );
}

export default async function TimetableView({
  basePath,
  slots,
  searchParams,
  subtitle,
  studentId,
}: {
  basePath: string;
  slots: TimetableSlotItem[];
  searchParams: { view?: string; month?: string; date?: string };
  subtitle: string;
  studentId?: string;
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
        classes={await enrichDay(studentId, projectDay(slots, date))}
      />
    );
  } else if (view === "week") {
    body = (
      <TimetableWeekGrid
        days={await enrichWeek(studentId, projectWeek(slots, getWeekStartUTC(today)))}
      />
    );
  } else if (view === "nextweek") {
    body = (
      <TimetableWeekGrid
        days={await enrichWeek(
          studentId,
          projectWeek(slots, addDaysUTC(getWeekStartUTC(today), 7))
        )}
      />
    );
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
            classes={await enrichDay(studentId, projectDay(slots, parseISODate(searchParams.date)))}
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
        classes={await enrichDay(studentId, projectDay(slots, today))}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-extrabold text-ink-900">Timetable</h1>
        <p className="mt-1 text-sm text-ink-900/50">{subtitle}</p>
      </div>
      <TimetableViewTabs basePath={basePath} active={view} />
      {body}
    </div>
  );
}
