"use client";

import { useState, useTransition } from "react";
import { createTimetableSlotAction, updateTimetableSlotAction } from "@/lib/actions/timetable";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import type { CourseOption, BatchOption } from "@/types/attendance";
import type { TimetableSlotItem } from "@/types/timetable";

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function TimetableSlotForm({
  courses,
  batches,
  initial,
  onSaved,
  onCancel,
}: {
  courses: CourseOption[];
  batches: BatchOption[];
  initial?: TimetableSlotItem;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const isEditing = !!initial;
  const [courseId, setCourseId] = useState(initial?.courseId ?? courses[0]?.id ?? "");
  const [batchId, setBatchId] = useState(initial?.batchId ?? "");
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [specificDate, setSpecificDate] = useState(initial?.specificDate ?? "");
  const [dayOfWeek, setDayOfWeek] = useState(initial?.dayOfWeek ?? 1);
  const [startTime, setStartTime] = useState(initial?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "10:00");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [meetingLink, setMeetingLink] = useState(initial?.meetingLink ?? "");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleDateChange(value: string) {
    setSpecificDate(value);
    if (value) {
      // Keep dayOfWeek consistent with the chosen date, purely for display
      // in the admin table — the actual scheduling logic uses specificDate
      // directly and ignores dayOfWeek whenever specificDate is set.
      const parsed = new Date(`${value}T00:00:00Z`);
      if (!Number.isNaN(parsed.getTime())) setDayOfWeek(parsed.getUTCDay());
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    const payload = {
      courseId,
      batchId: batchId || undefined,
      topic: topic || undefined,
      specificDate: specificDate || undefined,
      dayOfWeek,
      startTime,
      endTime,
      location: location || undefined,
      meetingLink: meetingLink || undefined,
    };

    startTransition(async () => {
      const res = isEditing
        ? await updateTimetableSlotAction({ slotId: initial!.id, ...payload })
        : await createTimetableSlotAction(payload);
      setResult(res);
      if (res.success) onSaved?.();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-sm border border-gold-500/30 bg-gold-500/5 p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">
          {isEditing ? "Edit class" : "Add a class to the timetable"}
        </p>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-medium text-ink-900/50 hover:text-ink-900"
          >
            Cancel
          </button>
        )}
      </div>

      {result && <Alert variant={result.success ? "success" : "error"}>{result.message}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="courseId" className="mb-1.5 block text-sm font-medium text-ink-800">
            Course
          </label>
          <select
            id="courseId"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="batchId" className="mb-1.5 block text-sm font-medium text-ink-800">
            Batch <span className="font-normal text-ink-900/40">(optional)</span>
          </label>
          <select
            id="batchId"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          >
            <option value="">All batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <Input
            label="Topic (optional)"
            name="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Chapter 4: Cognitive Development"
          />
        </div>

        <div>
          <Input
            label="Date (optional — for a one-time class)"
            name="specificDate"
            type="date"
            value={specificDate}
            onChange={(e) => handleDateChange(e.target.value)}
          />
          <p className="mt-1 text-xs text-ink-900/40">
            Leave blank for a class that repeats every week. Fill in a date for a single one-off
            class instead.
          </p>
        </div>

        <div>
          <label htmlFor="dayOfWeek" className="mb-1.5 block text-sm font-medium text-ink-800">
            Day of week{" "}
            {specificDate && (
              <span className="font-normal text-ink-900/40">(set automatically from date)</span>
            )}
          </label>
          <select
            id="dayOfWeek"
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            disabled={!!specificDate}
            className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-ink-900/5 disabled:text-ink-900/50"
          >
            {DAY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Location (optional)"
          name="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Room 118"
        />

        <Input
          label="Start time"
          name="startTime"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
        <Input
          label="End time"
          name="endTime"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />

        <div className="sm:col-span-2">
          <Input
            label="Meeting link (optional)"
            name="meetingLink"
            type="url"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            placeholder="https://zoom.us/j/…"
          />
        </div>
      </div>

      <Button type="submit" isLoading={isPending} className="sm:w-auto sm:px-8">
        {isEditing ? "Save changes" : "Add to timetable"}
      </Button>
    </form>
  );
}
