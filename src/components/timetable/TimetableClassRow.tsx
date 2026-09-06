"use client";

import { useState, useTransition } from "react";
import { Clock, MapPin, Video, User, PlayCircle, CheckCircle2, XCircle } from "lucide-react";
import TimetableStatusBadge from "@/components/timetable/TimetableStatusBadge";
import { markSessionCompletionAction } from "@/lib/actions/session-completion";
import type { ProjectedClass, StudentProjectedClass } from "@/types/timetable";

function formatTimeRange(start: string, end: string): string {
  function to12h(hhmm: string): string {
    const [h, m] = hhmm.split(":").map(Number);
    const period = h! >= 12 ? "PM" : "AM";
    const hour12 = h! % 12 === 0 ? 12 : h! % 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
  }
  return `${to12h(start)} – ${to12h(end)}`;
}

// Faculty/admin views of the timetable render this same row with plain
// ProjectedClass data (no completion info, no marking controls). Student
// views pass the enriched StudentProjectedClass, which turns on the
// self-mark UI. Checking for one of the extra fields is enough to tell
// which case we're in without a separate prop.
function hasCompletionData(item: ProjectedClass | StudentProjectedClass): item is StudentProjectedClass {
  return "liveAttended" in item;
}

export default function TimetableClassRow({ item }: { item: ProjectedClass | StudentProjectedClass }) {
  const [isPending, startTransition] = useTransition();
  const [justMarked, setJustMarked] = useState<"RECORDING" | "TEST" | null>(null);
  const student = hasCompletionData(item) ? item : null;
  const isPast = item.status === "completed";

  function mark(kind: "LIVE" | "RECORDING" | "TEST") {
    startTransition(async () => {
      const res = await markSessionCompletionAction(item.id, item.date, kind);
      if (res.success && kind !== "LIVE") setJustMarked(kind);
    });
  }

  const recordingWatched = student ? student.recordingWatched || justMarked === "RECORDING" : false;
  const testAttended = student ? student.testAttended || justMarked === "TEST" : false;

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
        <div className="flex items-center gap-1.5">
          {item.isExam && (
            <span className="rounded-sm bg-signal-error/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-signal-error">
              Exam
            </span>
          )}
          {item.specificDate && (
            <span className="rounded-sm bg-ink-900/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-900/50">
              One-time
            </span>
          )}
          <TimetableStatusBadge status={item.status} />
        </div>
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
        {item.meetingLink && !item.isExam && (
          
            href={item.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => student && mark("LIVE")}
            className="flex items-center gap-1.5 font-medium text-gold-600 hover:underline"
          >
            <Video size={12} aria-hidden="true" />
            Join meeting
          </a>
        )}
        {item.recordingUrl && (
          
            href={item.recordingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-medium text-gold-600 hover:underline"
          >
            <PlayCircle size={12} aria-hidden="true" />
            Watch recording
          </a>
        )}
      </div>

      {/* Self-mark controls and attendance status — student view only. */}
      {student && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-900/8 pt-3">
          {item.recordingUrl &&
            (recordingWatched ? (
              <span className="flex items-center gap-1 rounded-sm bg-signal-success/10 px-2 py-1 text-xs font-medium text-signal-success">
                <CheckCircle2 size={12} aria-hidden="true" />
                Recording watched
              </span>
            ) : (
              <button
                type="button"
                onClick={() => mark("RECORDING")}
                disabled={isPending}
                className="rounded-sm border border-ink-900/15 px-2 py-1 text-xs font-medium text-ink-900/70 hover:bg-ink-900/5 disabled:opacity-50"
              >
                Mark recording as watched
              </button>
            ))}

          {item.isExam &&
            (testAttended ? (
              <span className="flex items-center gap-1 rounded-sm bg-signal-success/10 px-2 py-1 text-xs font-medium text-signal-success">
                <CheckCircle2 size={12} aria-hidden="true" />
                Attended
              </span>
            ) : isPast ? (
              <span className="flex items-center gap-1 rounded-sm bg-signal-error/10 px-2 py-1 text-xs font-medium text-signal-error">
                <XCircle size={12} aria-hidden="true" />
                Missed
              </span>
            ) : (
              <button
                type="button"
                onClick={() => mark("TEST")}
                disabled={isPending}
                className="rounded-sm bg-ink-900 px-2.5 py-1 text-xs font-medium text-parchment-50 hover:bg-ink-800 disabled:opacity-50"
              >
                Mark as Attended
              </button>
            ))}

          {!item.isExam &&
            isPast &&
            (student.liveAttended ? (
              <span className="flex items-center gap-1 rounded-sm bg-signal-success/10 px-2 py-1 text-xs font-medium text-signal-success">
                <CheckCircle2 size={12} aria-hidden="true" />
                Attended
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-sm bg-signal-error/10 px-2 py-1 text-xs font-medium text-signal-error">
                <XCircle size={12} aria-hidden="true" />
                Missed
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
