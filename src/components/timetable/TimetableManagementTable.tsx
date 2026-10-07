"use client";

import { useState, useTransition } from "react";
import { Clock, Pencil, Trash2, Power, Video, ChevronDown, FolderOpen } from "lucide-react";
import {
  toggleTimetableSlotActiveAction,
  deleteTimetableSlotAction,
} from "@/lib/actions/timetable";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Badge from "@/components/ui/Badge";
import { WEEKDAY_LONG, parseISODate, formatDisplayDate } from "@/lib/utils/date";
import type { TimetableSlotItem } from "@/types/timetable";

function Row({ slot, onEdit }: { slot: TimetableSlotItem; onEdit: () => void }) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(() => {
      toggleTimetableSlotActiveAction(slot.id, !slot.isActive);
    });
  }

  function remove() {
    if (!confirm(`Remove ${slot.courseCode} on ${WEEKDAY_LONG[slot.dayOfWeek]}?`)) return;
    startTransition(() => {
      deleteTimetableSlotAction(slot.id);
    });
  }

  return (
    <tr className={slot.isActive ? "" : "opacity-50"}>
      <td className="px-5 py-3">
        <p className="font-medium text-ink-900">
          {slot.facultyName}
          {slot.batchName ? ` · ${slot.batchName}` : ""}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5">
          {slot.isExam && (
            <span className="rounded-sm bg-signal-error/10 px-1.5 py-0.5 text-xs font-medium text-signal-error">
              Exam
            </span>
          )}
          {slot.topic && (
            <span className="inline-block rounded-sm bg-gold-500/15 px-1.5 py-0.5 text-xs font-medium text-gold-700">
              {slot.topic}
            </span>
          )}
        </p>
      </td>
      <td className="px-5 py-3 text-ink-900/70">
        <p className="flex items-center gap-1.5">
          {slot.specificDate ? formatDisplayDate(parseISODate(slot.specificDate)) : WEEKDAY_LONG[slot.dayOfWeek]}
          {slot.specificDate && (
            <span className="rounded-sm bg-ink-900/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-900/50">
              One-time
            </span>
          )}
        </p>
        <p className="flex items-center gap-1 text-xs text-ink-900/45">
          <Clock size={11} aria-hidden="true" />
          {slot.startTime} – {slot.endTime}
        </p>
      </td>
      <td className="px-5 py-3 text-ink-900/70">
        {slot.location ?? "—"}
        {slot.meetingLink && (
          <a
            href={slot.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center gap-1 text-xs text-gold-600 hover:underline"
          >
            <Video size={11} aria-hidden="true" />
            Link
          </a>
        )}
      </td>
      <td className="px-5 py-3">
        <Badge variant={slot.isActive ? "success" : "neutral"}>
          {slot.isActive ? "Active" : "Disabled"}
        </Badge>
      </td>
      <td className="px-5 py-3">
        <div className="flex justify-end gap-1.5">
          <button
            onClick={onEdit}
            aria-label="Edit"
            className="rounded-sm p-1.5 text-ink-900/50 hover:bg-ink-900/5 hover:text-ink-900"
          >
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button
            onClick={toggle}
            disabled={isPending}
            aria-label={slot.isActive ? "Disable" : "Enable"}
            className="rounded-sm p-1.5 text-ink-900/50 hover:bg-ink-900/5 hover:text-ink-900 disabled:opacity-50"
          >
            <Power size={15} aria-hidden="true" />
          </button>
          <button
            onClick={remove}
            disabled={isPending}
            aria-label="Delete"
            className="rounded-sm p-1.5 text-ink-900/50 hover:bg-signal-error/10 hover:text-signal-error disabled:opacity-50"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}

interface CourseGroup {
  courseId: string;
  courseCode: string;
  courseName: string;
  slots: TimetableSlotItem[];
}

// One-time classes (specificDate set) sort chronologically by that date.
// Recurring weekly classes (no specificDate) have no single date, so they
// sort after every one-time class, by weekday then start time.
function slotSortKey(s: TimetableSlotItem): string {
  const time = s.startTime.padStart(5, "0");
  return s.specificDate ? `0-${s.specificDate}-${time}` : `1-${s.dayOfWeek}-${time}`;
}

function groupByCourse(slots: TimetableSlotItem[]): CourseGroup[] {
  const map = new Map<string, CourseGroup>();
  for (const s of slots) {
    if (!map.has(s.courseId)) {
      map.set(s.courseId, {
        courseId: s.courseId,
        courseCode: s.courseCode,
        courseName: s.courseName,
        slots: [],
      });
    }
    map.get(s.courseId)!.slots.push(s);
  }
  const groups = Array.from(map.values()).sort((a, b) => a.courseCode.localeCompare(b.courseCode));
  for (const g of groups) {
    g.slots.sort((a, b) => slotSortKey(a).localeCompare(slotSortKey(b)));
  }
  return groups;
}

function CourseSection({
  group,
  isExpanded,
  onToggle,
  onEdit,
}: {
  group: CourseGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (slot: TimetableSlotItem) => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 bg-ink-900/[0.03] px-5 py-3 text-left transition-colors hover:bg-ink-900/[0.05]"
      >
        <span className="flex items-center gap-2.5">
          <FolderOpen size={15} className="text-gold-600" aria-hidden="true" />
          <span className="text-sm font-semibold text-ink-900">
            {group.courseCode} — {group.courseName}
          </span>
          <span className="text-xs text-ink-900/40">
            {group.slots.length} class{group.slots.length === 1 ? "" : "es"}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-ink-900/40 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                <th className="px-5 py-3 font-medium">Faculty / Batch</th>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Where</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-ink-900/8 divide-y">
              {group.slots.map((slot) => (
                <Row key={slot.id} slot={slot} onEdit={() => onEdit(slot)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function TimetableManagementTable({
  slots,
  onEdit,
}: {
  slots: TimetableSlotItem[];
  onEdit: (slot: TimetableSlotItem) => void;
}) {
  const [courseFilter, setCourseFilter] = useState("all");
  // Every course section starts open; ids in this set are the ones the
  // admin has manually collapsed. Each section toggles independently.
  const [collapsedCourseIds, setCollapsedCourseIds] = useState<Set<string>>(new Set());

  const courseOptions = Array.from(
    new Map(slots.map((s) => [s.courseId, { id: s.courseId, code: s.courseCode, name: s.courseName }])).values()
  ).sort((a, b) => a.code.localeCompare(b.code));

  const visibleSlots =
    courseFilter === "all" ? slots : slots.filter((s) => s.courseId === courseFilter);
  const groups = groupByCourse(visibleSlots);

  return (
    <div className="space-y-4">
      {slots.length > 0 && (
        <div className="flex items-center gap-2">
          <label htmlFor="timetableCourseFilter" className="text-xs font-medium text-ink-900/50">
            Course
          </label>
          <select
            id="timetableCourseFilter"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="rounded-sm border border-ink-900/15 bg-white px-3 py-1.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          >
            <option value="all">All courses</option>
            {courseOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <DashboardCard title="Weekly Schedule" bodyClassName="p-0">
        {groups.length === 0 ? (
          <p className="p-5 text-center text-sm text-ink-900/45">No classes on the timetable yet.</p>
        ) : (
          <div className="divide-ink-900/8 divide-y">
            {groups.map((group) => (
              <CourseSection
                key={group.courseId}
                group={group}
                isExpanded={!collapsedCourseIds.has(group.courseId)}
                onToggle={() =>
                  setCollapsedCourseIds((current) => {
                    const next = new Set(current);
                    if (next.has(group.courseId)) {
                      next.delete(group.courseId);
                    } else {
                      next.add(group.courseId);
                    }
                    return next;
                  })
                }
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
