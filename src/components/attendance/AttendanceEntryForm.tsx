"use client";

import { useState, useTransition } from "react";
import type { AttendanceStatus } from "@prisma/client";
import { markAttendanceAction } from "@/lib/actions/attendance";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import type { RosterEntry } from "@/types/attendance";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LEAVE", label: "Leave" },
];

const SELECTED_CLASSES: Record<AttendanceStatus, string> = {
  PRESENT: "border-signal-success bg-signal-success/10 text-signal-success",
  ABSENT: "border-signal-error bg-signal-error/10 text-signal-error",
  LEAVE: "border-gold-500 bg-gold-500/10 text-gold-600",
};

export default function AttendanceEntryForm({
  courseId,
  date,
  roster,
}: {
  courseId: string;
  date: string;
  roster: RosterEntry[];
}) {
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(() =>
    Object.fromEntries(roster.map((r) => [r.studentId, r.status ?? "PRESENT"]))
  );
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function setAll(status: AttendanceStatus) {
    setStatuses(Object.fromEntries(roster.map((r) => [r.studentId, status])));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await markAttendanceAction({
        courseId,
        date,
        entries: roster.map((r) => ({ studentId: r.studentId, status: statuses[r.studentId]! })),
      });
      setResult(res);
    });
  }

  if (roster.length === 0) {
    return (
      <p className="rounded-sm border border-ink-900/10 bg-white p-5 text-sm text-ink-900/50">
        No students are enrolled in this course yet.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {result && <Alert variant={result.success ? "success" : "error"}>{result.message}</Alert>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setAll("PRESENT")}
          className="text-xs font-medium text-ink-900/60 underline-offset-2 hover:text-ink-900 hover:underline"
        >
          Mark all present
        </button>
        <span className="text-ink-900/25">·</span>
        <button
          type="button"
          onClick={() => setAll("ABSENT")}
          className="text-xs font-medium text-ink-900/60 underline-offset-2 hover:text-ink-900 hover:underline"
        >
          Mark all absent
        </button>
      </div>

      <ul className="divide-ink-900/8 divide-y rounded-sm border border-ink-900/10 bg-white">
        {roster.map((student) => (
          <li
            key={student.studentId}
            className="flex flex-col gap-2.5 p-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink-900">{student.name}</p>
              <p className="truncate text-xs text-ink-900/45">{student.email}</p>
            </div>
            <div
              role="radiogroup"
              aria-label={`Attendance status for ${student.name}`}
              className="flex gap-1.5"
            >
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = statuses[student.studentId] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setStatuses((s) => ({ ...s, [student.studentId]: opt.value }))}
                    className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? SELECTED_CLASSES[opt.value]
                        : "border-ink-900/15 text-ink-900/50 hover:bg-ink-900/5"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      <Button type="submit" isLoading={isPending} className="sm:w-auto sm:px-8">
        Save Attendance
      </Button>
    </form>
  );
}
