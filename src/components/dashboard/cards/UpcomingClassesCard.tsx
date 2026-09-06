import { CalendarClock, MapPin, Video } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { ScheduleItem } from "@/types/student-dashboard";

export default function UpcomingClassesCard({ items }: { items: ScheduleItem[] }) {
  return (
    <DashboardCard title="Upcoming Classes" icon={CalendarClock}>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-900/45">No classes scheduled.</p>
      ) : (
        <ul className="divide-ink-900/8 divide-y">
          {items.map((item) => (
            <li key={item.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{item.courseName}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-900/50">{item.instructor}</p>
                  {item.topic && (
                    <p className="mt-1.5 inline-block rounded-sm bg-gold-500/15 px-1.5 py-0.5 text-xs font-medium text-gold-700">
                      {item.topic}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-ink-900">{item.day}</p>
                  <p className="text-xs text-ink-900/45">{item.date}</p>
                  <p className="text-xs text-ink-900/50">{item.time}</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-900/45">
                <span className="flex items-center gap-1">
                  <MapPin size={12} aria-hidden="true" />
                  {item.location}
                </span>
                {item.meetingLink && (
                  
                    href={item.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-medium text-gold-600 hover:underline"
                  >
                    <Video size={12} aria-hidden="true" />
                    Join meeting
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
