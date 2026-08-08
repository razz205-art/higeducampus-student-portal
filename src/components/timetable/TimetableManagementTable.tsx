"use client";

import { useTransition } from "react";
import { Clock, Pencil, Trash2, Power, Video } from "lucide-react";
import {
  toggleTimetableSlotActiveAction,
  deleteTimetableSlotAction,
} from "@/lib/actions/timetable";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Badge from "@/components/ui/Badge";
import { WEEKDAY_LONG } from "@/lib/utils/date";
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
          {slot.courseCode} — {slot.courseName}
        </p>
        <p className="text-xs text-ink-900/45">
          {slot.facultyName}
          {slot.batchName ? ` · ${slot.batchName}` : ""}
        </p>
      </td>
      <td className="px-5 py-3 text-ink-900/70">
        <p>{WEEKDAY_LONG[slot.dayOfWeek]}</p>
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

export default function TimetableManagementTable({
  slots,
  onEdit,
}: {
  slots: TimetableSlotItem[];
  onEdit: (slot: TimetableSlotItem) => void;
}) {
  return (
    <DashboardCard title="Weekly Schedule" bodyClassName="p-0">
      {slots.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">No classes on the timetable yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Where</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-ink-900/8 divide-y">
              {slots.map((slot) => (
                <Row key={slot.id} slot={slot} onEdit={() => onEdit(slot)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
