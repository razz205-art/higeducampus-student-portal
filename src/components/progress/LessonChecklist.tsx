"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { toggleLessonCompletionAction } from "@/lib/actions/progress";
import type { LessonItem } from "@/types/progress";

export default function LessonChecklist({ lessons }: { lessons: LessonItem[] }) {
  const [localLessons, setLocalLessons] = useState(lessons);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(lessonId: string, nextCompleted: boolean) {
    setPendingId(lessonId);
    setLocalLessons((prev) =>
      prev.map((l) => (l.id === lessonId ? { ...l, completed: nextCompleted } : l))
    );
    startTransition(async () => {
      const res = await toggleLessonCompletionAction({ lessonId, completed: nextCompleted });
      if (!res.success) {
        // Revert on failure (e.g. permission error).
        setLocalLessons((prev) =>
          prev.map((l) => (l.id === lessonId ? { ...l, completed: !nextCompleted } : l))
        );
      }
      setPendingId(null);
    });
  }

  return (
    <ul className="divide-ink-900/8 divide-y">
      {localLessons.map((lesson) => (
        <li key={lesson.id} className="flex items-center gap-3 py-2.5">
          <button
            onClick={() => toggle(lesson.id, !lesson.completed)}
            disabled={pendingId === lesson.id}
            aria-pressed={lesson.completed}
            className="flex items-center gap-2.5 text-left disabled:opacity-50"
          >
            {lesson.completed ? (
              <CheckCircle2 size={18} className="shrink-0 text-signal-success" aria-hidden="true" />
            ) : (
              <Circle size={18} className="shrink-0 text-ink-900/25" aria-hidden="true" />
            )}
            <span
              className={`text-sm ${lesson.completed ? "text-ink-900/50 line-through" : "text-ink-900"}`}
            >
              {lesson.title}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
