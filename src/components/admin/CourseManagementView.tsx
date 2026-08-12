"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import {
  createCourseAction,
  updateCourseAction,
  deleteCourseAction,
} from "@/lib/actions/admin-courses";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import type { AdminCourseRow, FacultyOption } from "@/lib/data/admin-courses";

function CourseForm({
  faculty,
  initial,
  onDone,
}: {
  faculty: FacultyOption[];
  initial?: AdminCourseRow;
  onDone: () => void;
}) {
  const isEditing = !!initial;
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [facultyId, setFacultyId] = useState(initial?.facultyId ?? faculty[0]?.id ?? "");
  const [additionalFacultyIds, setAdditionalFacultyIds] = useState<string[]>(
    initial?.additionalFacultyIds ?? []
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleCoFaculty(id: string) {
    setAdditionalFacultyIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = isEditing
        ? await updateCourseAction({
            courseId: initial!.id,
            code,
            name,
            facultyId,
            additionalFacultyIds,
          })
        : await createCourseAction({ code, name, facultyId, additionalFacultyIds });
      if (res.success) {
        onDone();
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-sm border border-gold-500/30 bg-gold-500/5 p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">
          {isEditing ? "Edit course" : "Add a course"}
        </p>
        <button
          type="button"
          onClick={onDone}
          className="text-xs font-medium text-ink-900/50 hover:text-ink-900"
        >
          Cancel
        </button>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Course code"
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. CS101"
          required
        />
        <Input
          label="Course name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="sm:col-span-2">
          <label htmlFor="facultyId" className="mb-1.5 block text-sm font-medium text-ink-800">
            Primary faculty
          </label>
          <select
            id="facultyId"
            value={facultyId}
            onChange={(e) => setFacultyId(e.target.value)}
            className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          >
            {faculty.length === 0 && <option value="">No faculty accounts yet</option>}
            {faculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {faculty.length > 1 && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-800">
            Additional faculty{" "}
            <span className="font-normal text-ink-900/40">
              (optional — co-teachers get the same full access as the primary faculty)
            </span>
          </p>
          <div className="grid grid-cols-1 gap-2 rounded-sm border border-ink-900/15 bg-white p-3 sm:grid-cols-2">
            {faculty
              .filter((f) => f.id !== facultyId)
              .map((f) => (
                <label key={f.id} className="flex items-center gap-2 text-sm text-ink-900/80">
                  <input
                    type="checkbox"
                    checked={additionalFacultyIds.includes(f.id)}
                    onChange={() => toggleCoFaculty(f.id)}
                    className="rounded border-ink-900/25"
                  />
                  {f.name}
                </label>
              ))}
          </div>
        </div>
      )}

      <Button type="submit" isLoading={isPending} className="sm:w-auto sm:px-8">
        {isEditing ? "Save changes" : "Add course"}
      </Button>
    </form>
  );
}

function Row({ course, onEdit }: { course: AdminCourseRow; onEdit: () => void }) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!confirm(`Delete ${course.code}? This cannot be undone.`)) return;
    startTransition(() => {
      deleteCourseAction(course.id);
    });
  }

  return (
    <tr>
      <td className="px-5 py-3">
        <span className="font-medium text-ink-900">{course.code}</span>
        <span className="text-ink-900/50"> — {course.name}</span>
      </td>
      <td className="px-5 py-3 text-ink-900/70">
        {course.facultyName}
        {course.additionalFacultyNames.length > 0 && (
          <p className="mt-0.5 text-xs text-ink-900/40">
            + {course.additionalFacultyNames.join(", ")}
          </p>
        )}
      </td>
      <td className="px-5 py-3 text-ink-900/70">{course.enrolledCount}</td>
      <td className="px-5 py-3 text-right">
        <div className="flex justify-end gap-1.5">
          <button
            onClick={onEdit}
            aria-label="Edit"
            className="rounded-sm p-1.5 text-ink-900/50 hover:bg-ink-900/5 hover:text-ink-900"
          >
            <Pencil size={15} aria-hidden="true" />
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

export default function CourseManagementView({
  courses,
  faculty,
}: {
  courses: AdminCourseRow[];
  faculty: FacultyOption[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<AdminCourseRow | null>(null);

  return (
    <div className="space-y-6">
      {!showCreate && !editing && (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-sm bg-ink-900 px-3.5 py-2 text-xs font-medium text-parchment-50 hover:bg-ink-800"
        >
          <Plus size={14} aria-hidden="true" />
          Add course
        </button>
      )}
      {showCreate && <CourseForm faculty={faculty} onDone={() => setShowCreate(false)} />}
      {editing && (
        <CourseForm faculty={faculty} initial={editing} onDone={() => setEditing(null)} />
      )}

      <DashboardCard title="Courses" icon={BookOpen} bodyClassName="p-0">
        {courses.length === 0 ? (
          <p className="p-5 text-center text-sm text-ink-900/45">No courses yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-5 py-3 font-medium">Faculty</th>
                  <th className="px-5 py-3 font-medium">Enrolled</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-ink-900/8 divide-y">
                {courses.map((c) => (
                  <Row key={c.id} course={c} onEdit={() => setEditing(c)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
