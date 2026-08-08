import { CalendarDays } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import TimetableClassRow from "@/components/timetable/TimetableClassRow";
import { formatDisplayDate, parseISODate } from "@/lib/utils/date";
import type { ProjectedClass } from "@/types/timetable";

export default function TimetableDayList({
  title,
  date,
  classes,
}: {
  title: string;
  date: string;
  classes: ProjectedClass[];
}) {
  return (
    <DashboardCard
      title={title}
      icon={CalendarDays}
      action={
        <span className="text-xs text-ink-900/40">{formatDisplayDate(parseISODate(date))}</span>
      }
    >
      {classes.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-900/45">No classes scheduled.</p>
      ) : (
        <div className="space-y-3">
          {classes.map((c) => (
            <TimetableClassRow key={c.id} item={c} />
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
