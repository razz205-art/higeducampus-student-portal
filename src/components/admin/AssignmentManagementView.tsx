"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, ClipboardList } from "lucide-react";
import { createAssignmentAction, deleteAssignmentAction } from "@/lib/actions/admin-assignments";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import type { AdminAssignmentRow } from "@/lib/data/admin-assignments";
import type { CourseOption } from "@/types/attendance";

function AssignmentForm({ courses, onDone }: { courses: CourseOption[]; onDone: () => void }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await createAssignmentAction({
        courseId,
        title,
        dueDate,
        maxScore: Number(maxScore),
      });
      setResult(res);
      if (res.success) {
        setTitle("");
        setDueDate("");
        setMaxScore("100");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-sm border border-gold-500/30 bg-gold-500/5 p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">Add an assignment</p>
        <button
          type="button"
          onClick={onDone}
          className="text-xs font-medium text-ink-900/50 hover:text-ink-900"
        >
          Cancel
        </button>
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
        <Input
          label="Title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Input
          label="Due date"
          name="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
        <Input
          label="Max score"
          name="maxScore"
          type="number"
          value={maxScore}
          onChange={(e) => setMaxScore(e.target.value)}
          required
        />
      </div>
      <Button type="submit" isLoading={isPending} className="sm:w-auto sm:px-8">
        Add assignment
      </Button>
    </form>
  );
}

function Row({ assignment }: { assignment: AdminAssignmentRow }) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!confirm(`Delete "${assignment.title}"?`)) return;
    startTransition(() => {
      deleteAssignmentAction(assignment.id);
    });
  }

  return (
    <tr>
      <td className="px-5 py-3">
        <p className="font-medium text-ink-900">{assignment.title}</p>
        <p className="text-xs text-ink-900/45">{assignment.courseCode}</p>
      </td>
      <td className="px-5 py-3 text-ink-900/70">{assignment.dueDate}</td>
      <td className="px-5 py-3 text-ink-900/70">{assignment.maxScore}</td>
      <td className="px-5 py-3 text-ink-900/70">{assignment.submissionCount}</td>
      <td className="px-5 py-3 text-right">
        <button
          onClick={remove}
          disabled={isPending}
          aria-label="Delete"
          className="rounded-sm p-1.5 text-ink-900/50 hover:bg-signal-error/10 hover:text-signal-error disabled:opacity-50"
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}

export default function AssignmentManagementView({
  assignments,
  courses,
}: {
  assignments: AdminAssignmentRow[];
  courses: CourseOption[];
}) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      {!showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-sm bg-ink-900 px-3.5 py-2 text-xs font-medium text-parchment-50 hover:bg-ink-800"
        >
          <Plus size={14} aria-hidden="true" />
          Add assignment
        </button>
      )}
      {showCreate && <AssignmentForm courses={courses} onDone={() => setShowCreate(false)} />}

      <DashboardCard title="Assignments" icon={ClipboardList} bodyClassName="p-0">
        {assignments.length === 0 ? (
          <p className="p-5 text-center text-sm text-ink-900/45">No assignments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                  <th className="px-5 py-3 font-medium">Assignment</th>
                  <th className="px-5 py-3 font-medium">Due</th>
                  <th className="px-5 py-3 font-medium">Max Score</th>
                  <th className="px-5 py-3 font-medium">Submissions</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-ink-900/8 divide-y">
                {assignments.map((a) => (
                  <Row key={a.id} assignment={a} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
