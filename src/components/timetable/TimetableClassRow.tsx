import { Clock, MapPin, Video, User } from "lucide-react";
import TimetableStatusBadge from "@/components/timetable/TimetableStatusBadge";
import type { ProjectedClass } from "@/types/timetable";

function formatTimeRange(start: string, end: string): string {
  function to12h(hhmm: string): string {
    const [h, m] = hhmm.split(":").map(Number);
    const period = h! >= 12 ? "PM" : "AM";
    const hour12 = h! % 12 === 0 ? 12 : h! % 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
  }
  return `${to12h(start)} – ${to12h(end)}`;
}

export default function TimetableClassRow({ item }: { item: ProjectedClass }) {
  return (
    <div
      className={`rounded-sm border bg-white p-4 ${
        item.status === "ongoing" ? "border-signal-success/40" : "border-ink-900/10"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-900">
            {item.courseCode} — {item.courseName}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-900/50">
            <User size={12} aria-hidden="true" />
            {item.facultyName}
            {item.batchName && (
              <>
                <span>&middot;</span>
                {item.batchName}
              </>
            )}
          </p>
        </div>
        <TimetableStatusBadge status={item.status} />
      </div>

      {item.topic && (
        <p className="mt-2 inline-block rounded-sm bg-gold-500/15 px-2 py-1 text-xs font-medium text-gold-700">
          {item.topic}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-900/60">
        <span className="flex items-center gap-1.5">
          <Clock size={12} aria-hidden="true" />
          {formatTimeRange(item.startTime, item.endTime)}
        </span>
        {item.location && (
          <span className="flex items-center gap-1.5">
            <MapPin size={12} aria-hidden="true" />
            {item.location}
          </span>
        )}
        {item.meetingLink && (
          <a
            href={item.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-medium text-gold-600 hover:underline"
          >
            <Video size={12} aria-hidden="true" />
            Join meeting
          </a>
        )}
      </div>
    </div>
  );
}
