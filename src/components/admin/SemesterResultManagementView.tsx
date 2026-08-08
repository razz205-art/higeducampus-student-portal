"use client";

import { useState, useTransition } from "react";
import { Plus, X, Trash2, GraduationCap } from "lucide-react";
import {
  publishSemesterResultAction,
  deleteSemesterResultAction,
} from "@/lib/actions/admin-results";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import type { AdminSemesterResultRow, StudentOption } from "@/lib/data/admin-results";
import type { CourseOption } from "@/types/attendance";

interface CourseResultDraft {
  courseId: string;
  marksObtained: string;
  maxMarks: string;
  grade: string;
}

function PublishForm({
  students,
  courses,
  onDone,
}: {
  students: StudentOption[];
  courses: CourseOption[];
  onDone: () => void;
}) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [semesterLabel, setSemesterLabel] = useState("Semester 1");
  const [gpa, setGpa] = useState("");
  const [percentage, setPercentage] = useState("");
  const [status, setStatus] = useState<"PASS" | "FAIL" | "PENDING">("PASS");
  const [courseResults, setCourseResults] = useState<CourseResultDraft[]>([]);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function addRow() {
    setCourseResults((r) => [
      ...r,
      { courseId: courses[0]?.id ?? "", marksObtained: "", maxMarks: "100", grade: "" },
    ]);
  }
  function removeRow(i: number) {
    setCourseResults((r) => r.filter((_, idx) => idx !== i));
  }
  function updateRow(i: number, patch: Partial<CourseResultDraft>) {
    setCourseResults((r) => r.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await publishSemesterResultAction({
        studentId,
        semesterLabel,
        gpa: Number(gpa),
        percentage: Number(percentage),
        status,
        courseResults: courseResults
          .filter((c) => c.courseId && c.marksObtained && c.grade)
          .map((c) => ({
            courseId: c.courseId,
            marksObtained: Number(c.marksObtained),
            maxMarks: Number(c.maxMarks || 100),
            grade: c.grade,
          })),
      });
      setResult(res);
      if (res.success) onDone();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-sm border border-gold-500/30 bg-gold-500/5 p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">Publish semester result</p>
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
          <label htmlFor="studentId" className="mb-1.5 block text-sm font-medium text-ink-800">
            Student
          </label>
          <select
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Semester label"
          name="semesterLabel"
          value={semesterLabel}
          onChange={(e) => setSemesterLabel(e.target.value)}
          required
        />
        <Input
          label="GPA"
          name="gpa"
          type="number"
          step="0.01"
          value={gpa}
          onChange={(e) => setGpa(e.target.value)}
          required
        />
        <Input
          label="Percentage"
          name="percentage"
          type="number"
          step="0.1"
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
          required
        />
        <div>
          <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-ink-800">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "PASS" | "FAIL" | "PENDING")}
            className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          >
            <option value="PASS">Pass</option>
            <option value="FAIL">Fail</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink-800">Per-course marks (optional)</p>
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1 text-xs font-medium text-gold-600 hover:underline"
          >
            <Plus size={13} aria-hidden="true" />
            Add course
          </button>
        </div>
        {courseResults.map((row, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-2 rounded-sm border border-ink-900/10 bg-white p-2.5"
          >
            <select
              value={row.courseId}
              onChange={(e) => updateRow(i, { courseId: e.target.value })}
              className="rounded-sm border border-ink-900/15 bg-white px-2 py-1.5 text-xs"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
            <input
              value={row.marksObtained}
              onChange={(e) => updateRow(i, { marksObtained: e.target.value })}
              placeholder="Marks"
              type="number"
              className="w-20 rounded-sm border border-ink-900/15 bg-white px-2 py-1.5 text-xs"
            />
            <input
              value={row.maxMarks}
              onChange={(e) => updateRow(i, { maxMarks: e.target.value })}
              placeholder="Max"
              type="number"
              className="w-20 rounded-sm border border-ink-900/15 bg-white px-2 py-1.5 text-xs"
            />
            <input
              value={row.grade}
              onChange={(e) => updateRow(i, { grade: e.target.value })}
              placeholder="Grade"
              className="w-16 rounded-sm border border-ink-900/15 bg-white px-2 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              aria-label="Remove"
              className="rounded-sm p-1 text-ink-900/40 hover:bg-ink-900/5 hover:text-signal-error"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      <Button type="submit" isLoading={isPending} className="sm:w-auto sm:px-8">
        Publish result
      </Button>
    </form>
  );
}

const STATUS_VARIANT = { PASS: "success", FAIL: "danger", PENDING: "warning" } as const;

function Row({ result }: { result: AdminSemesterResultRow }) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!confirm(`Remove ${result.semesterLabel} for ${result.studentName}?`)) return;
    startTransition(() => {
      deleteSemesterResultAction(result.id);
    });
  }

  return (
    <tr>
      <td className="px-5 py-3">
        <p className="font-medium text-ink-900">{result.studentName}</p>
        <p className="text-xs text-ink-900/45">{result.semesterLabel}</p>
      </td>
      <td className="px-5 py-3 text-ink-900/70">{result.gpa.toFixed(2)}</td>
      <td className="px-5 py-3 text-ink-900/70">{result.percentage.toFixed(1)}%</td>
      <td className="px-5 py-3">
        <Badge variant={STATUS_VARIANT[result.status as keyof typeof STATUS_VARIANT]}>
          {result.status}
        </Badge>
      </td>
      <td className="px-5 py-3 text-ink-900/60">{result.publishedAt}</td>
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

export default function SemesterResultManagementView({
  results,
  students,
  courses,
}: {
  results: AdminSemesterResultRow[];
  students: StudentOption[];
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
          Publish result
        </button>
      )}
      {showCreate && (
        <PublishForm students={students} courses={courses} onDone={() => setShowCreate(false)} />
      )}

      <DashboardCard title="Published Results" icon={GraduationCap} bodyClassName="p-0">
        {results.length === 0 ? (
          <p className="p-5 text-center text-sm text-ink-900/45">No results published yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium">GPA</th>
                  <th className="px-5 py-3 font-medium">%</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Published</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-ink-900/8 divide-y">
                {results.map((r) => (
                  <Row key={r.id} result={r} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
