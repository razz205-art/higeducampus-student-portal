"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Pencil, Trash2, Archive, ArchiveRestore, X, Check } from "lucide-react";
import { updateExamAction, toggleExamActiveAction, deleteExamAction } from "@/lib/actions/exams";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Badge from "@/components/ui/Badge";
import type { ExamItem } from "@/types/exam";

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatExamDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function EditRow({ exam, onDone }: { exam: ExamItem; onDone: () => void }) {
  const [title, setTitle] = useState(exam.title);
  const [examDate, setExamDate] = useState(toDatetimeLocalValue(exam.examDate));
  const [description, setDescription] = useState(exam.description ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateExamAction({ examId: exam.id, title, examDate, description });
      if (res.success) {
        onDone();
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <tr className="bg-gold-500/5">
      <td className="px-5 py-3" colSpan={4}>
        {error && <p className="mb-2 text-xs text-signal-error">{error}</p>}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_auto_1fr_auto]">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-sm border border-ink-900/15 bg-white px-2.5 py-1.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            placeholder="Title"
          />
          <input
            type="datetime-local"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="rounded-sm border border-ink-900/15 bg-white px-2.5 py-1.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-sm border border-ink-900/15 bg-white px-2.5 py-1.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            placeholder="Description (optional)"
          />
          <div className="flex gap-1.5">
            <button
              onClick={save}
              disabled={isPending}
              aria-label="Save"
              className="flex items-center justify-center rounded-sm bg-ink-900 px-3 py-1.5 text-xs font-medium text-parchment-50 hover:bg-ink-800 disabled:opacity-50"
            >
              <Check size={14} aria-hidden="true" />
            </button>
            <button
              onClick={onDone}
              disabled={isPending}
              aria-label="Cancel"
              className="flex items-center justify-center rounded-sm border border-ink-900/15 px-3 py-1.5 text-xs font-medium text-ink-900/60 hover:bg-ink-900/5"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

function DisplayRow({ exam, onEdit }: { exam: ExamItem; onEdit: () => void }) {
  const [isPending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      await toggleExamActiveAction(exam.id, !exam.isActive);
    });
  }

  function remove() {
    if (!confirm(`Delete "${exam.title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteExamAction(exam.id);
    });
  }

  return (
    <tr className={exam.isActive ? "" : "opacity-50"}>
      <td className="px-5 py-3">
        <p className="font-medium text-ink-900">{exam.title}</p>
        {exam.description && <p className="text-xs text-ink-900/45">{exam.description}</p>}
      </td>
      <td className="px-5 py-3 text-ink-900/70">
        <span className="flex items-center gap-1.5">
          <CalendarClock size={13} aria-hidden="true" />
          {formatExamDate(exam.examDate)}
        </span>
      </td>
      <td className="px-5 py-3">
        <Badge variant={exam.isActive ? "success" : "neutral"}>
          {exam.isActive ? "Active" : "Archived"}
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
            onClick={toggleActive}
            disabled={isPending}
            aria-label={exam.isActive ? "Archive" : "Restore"}
            className="rounded-sm p-1.5 text-ink-900/50 hover:bg-ink-900/5 hover:text-ink-900 disabled:opacity-50"
          >
            {exam.isActive ? (
              <Archive size={15} aria-hidden="true" />
            ) : (
              <ArchiveRestore size={15} aria-hidden="true" />
            )}
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

export default function ExamManagementTable({ exams }: { exams: ExamItem[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <DashboardCard title="Manage Exams" bodyClassName="p-0">
      {exams.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">No exams added yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                <th className="px-5 py-3 font-medium">Exam</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-ink-900/8 divide-y">
              {exams.map((exam) =>
                editingId === exam.id ? (
                  <EditRow key={exam.id} exam={exam} onDone={() => setEditingId(null)} />
                ) : (
                  <DisplayRow key={exam.id} exam={exam} onEdit={() => setEditingId(exam.id)} />
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
