"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import TimetableSlotForm from "@/components/timetable/TimetableSlotForm";
import TimetableManagementTable from "@/components/timetable/TimetableManagementTable";
import type { CourseOption, BatchOption } from "@/types/attendance";
import type { TimetableSlotItem } from "@/types/timetable";

export default function TimetableAdminView({
  slots,
  courses,
  batches,
}: {
  slots: TimetableSlotItem[];
  courses: CourseOption[];
  batches: BatchOption[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<TimetableSlotItem | null>(null);

  return (
    <div className="space-y-6">
      {!showCreate && !editing && (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-sm bg-ink-900 px-3.5 py-2 text-xs font-medium text-parchment-50 hover:bg-ink-800"
        >
          <Plus size={14} aria-hidden="true" />
          Add a class
        </button>
      )}

      {showCreate && (
        <TimetableSlotForm
          courses={courses}
          batches={batches}
          onSaved={() => setShowCreate(false)}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {editing && (
        <TimetableSlotForm
          courses={courses}
          batches={batches}
          initial={editing}
          onSaved={() => setEditing(null)}
          onCancel={() => setEditing(null)}
        />
      )}

      <TimetableManagementTable slots={slots} onEdit={setEditing} />
    </div>
  );
}
