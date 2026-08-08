"use client";

import { useState, useTransition } from "react";
import { createLiveClassSessionAction } from "@/lib/actions/attendance";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { CourseOption, BatchOption } from "@/types/attendance";

export default function LiveClassSessionForm({
  courses,
  batches,
}: {
  courses: CourseOption[];
  batches: BatchOption[];
}) {
  const [values, setValues] = useState({
    courseId: courses[0]?.id ?? "",
    batchId: "",
    subjectLabel: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: "09:00",
    platform: "ZOOM" as "ZOOM" | "GOOGLE_MEET",
    meetingLink: "",
  });
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await createLiveClassSessionAction({
        courseId: values.courseId,
        batchId: values.batchId || undefined,
        subjectLabel: values.subjectLabel || undefined,
        date: values.date,
        startTime: values.startTime,
        platform: values.platform,
        meetingLink: values.meetingLink,
      });
      setResult(res);
      if (res.success) {
        setValues((v) => ({ ...v, meetingLink: "" }));
      }
    });
  }

  if (courses.length === 0) {
    return (
      <p className="rounded-sm border border-ink-900/10 bg-white p-5 text-sm text-ink-900/50">
        You aren&rsquo;t assigned to any courses yet — contact an administrator.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-sm border border-ink-900/10 bg-white p-5"
    >
      {result && <Alert variant={result.success ? "success" : "error"}>{result.message}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="courseId" className="mb-1.5 block text-sm font-medium text-ink-800">
            Course
          </label>
          <select
            id="courseId"
            value={values.courseId}
            onChange={(e) => setValues((v) => ({ ...v, courseId: e.target.value }))}
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
            value={values.batchId}
            onChange={(e) => setValues((v) => ({ ...v, batchId: e.target.value }))}
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

        <Input
          label="Subject (optional label)"
          name="subjectLabel"
          value={values.subjectLabel}
          onChange={(e) => setValues((v) => ({ ...v, subjectLabel: e.target.value }))}
          placeholder="Defaults to course name"
        />

        <div>
          <label htmlFor="platform" className="mb-1.5 block text-sm font-medium text-ink-800">
            Platform
          </label>
          <select
            id="platform"
            value={values.platform}
            onChange={(e) =>
              setValues((v) => ({ ...v, platform: e.target.value as "ZOOM" | "GOOGLE_MEET" }))
            }
            className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          >
            <option value="ZOOM">Zoom</option>
            <option value="GOOGLE_MEET">Google Meet</option>
          </select>
        </div>

        <Input
          label="Date"
          name="date"
          type="date"
          value={values.date}
          onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
          required
        />
        <Input
          label="Time"
          name="startTime"
          type="time"
          value={values.startTime}
          onChange={(e) => setValues((v) => ({ ...v, startTime: e.target.value }))}
          required
        />

        <div className="sm:col-span-2">
          <Input
            label="Meeting Link"
            name="meetingLink"
            type="url"
            placeholder="https://zoom.us/j/… or https://meet.google.com/…"
            value={values.meetingLink}
            onChange={(e) => setValues((v) => ({ ...v, meetingLink: e.target.value }))}
            required
          />
        </div>
      </div>

      <Button type="submit" isLoading={isPending} className="sm:w-auto sm:px-8">
        Generate Attendance Session
      </Button>
    </form>
  );
}
