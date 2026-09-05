"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronRight, Plus, Trash2, Users, BookOpen, X } from "lucide-react";
import {
  createBatchAction,
  deleteBatchAction,
  getBatchStudentsAction,
} from "@/lib/actions/admin-batches";
import type { BatchStudentRow } from "@/lib/actions/admin-batches";
import {
  getBatchCourseAccessAction,
  grantBatchCourseAccessAction,
  revokeBatchCourseAccessAction,
} from "@/lib/actions/course-batch-access";
import type { BatchCourseAccessRow } from "@/lib/actions/course-batch-access";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import type { AdminBatchRow } from "@/lib/data/admin-batches";
import type { CourseOption } from "@/types/attendance";

function BatchForm({ onDone, courses }: { onDone: () => void; courses: CourseOption[] }) {
  const [name, setName] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function toggleCourse(courseId: string) {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await createBatchAction({
        name,
        startYear: Number(startYear),
        endYear: Number(endYear),
      });

      if (!res.success || !res.batchId) {
        setResult(res);
        return;
      }

      if (selectedCourseIds.length === 0) {
        setResult(res);
        onDone();
        return;
      }

      const grantResults = await Promise.all(
        selectedCourseIds.map((courseId) => grantBatchCourseAccessAction(res.batchId!, courseId))
      );
      const failed = grantResults.filter((g) => !g.success).length;

      setResult({
        success: true,
        message:
          failed === 0
            ? `Batch created with access to ${selectedCourseIds.length} course${selectedCourseIds.length === 1 ? "" : "s"}.`
            : `Batch created, but ${failed} course${failed === 1 ? "" : "s"} couldn't be granted. You can retry from the batch row.`,
      });
      onDone();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-sm border border-gold-500/30 bg-gold-500/5 p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">Add a batch</p>
        <button
          type="button"
          onClick={onDone}
          className="text-xs font-medium text-ink-900/50 hover:text-ink-900"
        >
          Cancel
        </button>
      </div>
      {result && <Alert variant={result.success ? "success" : "error"}>{result.message}</Alert>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Batch name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. 2025 - 2029"
          required
        />
        <Input
          label="Start year"
          name="startYear"
          type="number"
          value={startYear}
          onChange={(e) => setStartYear(e.target.value)}
          placeholder="2025"
          required
        />
        <Input
          label="End year"
          name="endYear"
          type="number"
          value={endYear}
          onChange={(e) => setEndYear(e.target.value)}
          placeholder="2029"
          required
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-900/40">
          Course access (optional)
        </p>
        {courses.length === 0 ? (
          <p className="text-sm text-ink-900/45">
            No courses exist yet — you can grant access later from the batch row.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {courses.map((c) => {
              const checked = selectedCourseIds.includes(c.id);
              return (
                <label
                  key={c.id}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-xs ${
                    checked
                      ? "border-gold-500 bg-gold-500/10 text-ink-900"
                      : "border-ink-900/15 bg-white text-ink-900/70 hover:border-ink-900/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCourse(c.id)}
                    className="h-3.5 w-3.5 accent-gold-500"
                  />
                  {c.code} — {c.name}
                </label>
              );
            })}
          </div>
        )}
      </div>

      <Button type="submit" isLoading={isPending} className="sm:w-auto sm:px-8">
        Add batch
      </Button>
    </form>
  );
}

function CourseAccessSection({
  batchId,
  courses,
}: {
  batchId: string;
  courses: CourseOption[];
}) {
  const [isLoadPending, startLoadTransition] = useTransition();
  const [isGrantPending, startGrantTransition] = useTransition();
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [rows, setRows] = useState<BatchCourseAccessRow[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  if (!loaded && !isLoadPending && !error) {
    startLoadTransition(async () => {
      const result = await getBatchCourseAccessAction(batchId);
      if (result.success) {
        setRows(result.rows);
        setLoaded(true);
      } else {
        setError(result.message ?? "Couldn't load course access.");
      }
    });
  }

  const availableCourses = courses.filter((c) => !rows.some((r) => r.courseId === c.id));

  function grant() {
    const courseId = selectedCourseId || availableCourses[0]?.id;
    if (!courseId) return;
    setGrantError(null);
    startGrantTransition(async () => {
      const res = await grantBatchCourseAccessAction(batchId, courseId);
      if (!res.success) {
        setGrantError(res.message);
        return;
      }
      setLoaded(false);
      setSelectedCourseId("");
    });
  }

  function revoke(courseBatchId: string) {
    if (!confirm("Revoke this batch's access to that course? Every student currently in the batch loses access to it.")) {
      return;
    }
    startTransition(async () => {
      await revokeBatchCourseAccessAction(courseBatchId);
      setLoaded(false);
    });
  }

  return (
    <div className="space-y-2.5">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-900/40">
        <BookOpen size={13} aria-hidden="true" />
        Course access
      </p>

      {error && <p className="text-sm text-signal-error">{error}</p>}

      {loaded && (
        <div className="flex flex-wrap gap-2">
          {rows.length === 0 && (
            <p className="text-sm text-ink-900/45">
              This batch doesn&apos;t have standing access to any course yet.
            </p>
          )}
          {rows.map((r) => (
            <span
              key={r.id}
              className="flex items-center gap-1.5 rounded-sm border border-ink-900/10 bg-white py-1 pl-2.5 pr-1.5 text-xs text-ink-900"
            >
              {r.courseCode} — {r.courseName}
              <button
                onClick={() => revoke(r.id)}
                disabled={isPending}
                aria-label={`Revoke access to ${r.courseCode}`}
                className="rounded-sm p-0.5 text-ink-900/40 hover:bg-signal-error/10 hover:text-signal-error disabled:opacity-50"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      {loaded && availableCourses.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="rounded-sm border border-ink-900/15 bg-white px-2.5 py-1.5 text-xs text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          >
            {availableCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={grant}
            disabled={isGrantPending}
            className="flex items-center gap-1 rounded-sm bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-parchment-50 hover:bg-ink-800 disabled:opacity-50"
          >
            <Plus size={12} aria-hidden="true" />
            {isGrantPending ? "Granting…" : "Grant access"}
          </button>
        </div>
      )}

      {grantError && <p className="text-xs text-signal-error">{grantError}</p>}
    </div>
  );
}

function StudentsTable({ batchId, batchName }: { batchId: string; batchName: string }) {
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<BatchStudentRow[]>([]);

  // Fetch once, the first time this renders (i.e. the first time the row
  // is expanded) — not re-fetched on every collapse/expand toggle.
  if (!loaded && !isPending && !error) {
    startTransition(async () => {
      const result = await getBatchStudentsAction(batchId);
      if (result.success) {
        setStudents(result.students);
        setLoaded(true);
      } else {
        setError(result.message ?? "Couldn't load students.");
      }
    });
  }

  return (
    <div className="space-y-2.5">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-900/40">
        <Users size={13} aria-hidden="true" />
        Students
      </p>
      {isPending && !loaded && (
        <p className="text-sm text-ink-900/45">Loading students in {batchName}…</p>
      )}
      {error && <p className="text-sm text-signal-error">{error}</p>}
      {loaded && students.length === 0 && (
        <p className="text-sm text-ink-900/45">No students enrolled in this batch yet.</p>
      )}
      {loaded && students.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-ink-900/8 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Registration No.</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-ink-900/8 divide-y">
              {students.map((s) => (
                <tr key={s.id} className={s.isActive ? "" : "opacity-50"}>
                  <td className="px-4 py-2 font-medium text-ink-900">{s.name ?? "—"}</td>
                  <td className="px-4 py-2 text-ink-900/70">{s.email}</td>
                  <td className="px-4 py-2 text-ink-900/70">{s.registrationNumber ?? "—"}</td>
                  <td className="px-4 py-2">
                    <Badge variant={s.isActive ? "success" : "neutral"}>
                      {s.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BatchCard({ batch, courses }: { batch: AdminBatchRow; courses: CourseOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [hasOpened, setHasOpened] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function remove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete batch "${batch.name}"?`)) return;
    startTransition(() => {
      deleteBatchAction(batch.id);
    });
  }

  // Native <details> always renders its children into the DOM (just hides
  // them when closed), including during server rendering — so without a
  // "has this ever been opened" guard, CourseAccessSection/StudentsTable
  // would try to fetch data while the page is being server-rendered and
  // crash the route. We track that via the browser's own toggle event so
  // expand/collapse itself stays fully native and reliable.
  //
  // The toggle event on <details> does not bubble, and React 18's event
  // system relies on bubbling for delegation — so the onToggle *prop*
  // doesn't fire reliably here. Attaching the listener straight to the DOM
  // node with a ref sidesteps React's event system entirely.
  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    function handleToggle() {
      if (el!.open) setHasOpened(true);
    }
    el.addEventListener("toggle", handleToggle);
    return () => el.removeEventListener("toggle", handleToggle);
  }, []);

  return (
    <details ref={detailsRef} className="group border-ink-900/8 border-b">
      <summary className="grid cursor-pointer list-none grid-cols-[1fr_140px_100px_44px] items-center gap-2 px-5 py-3 text-sm hover:bg-ink-900/[0.02] [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-1.5 font-medium text-ink-900">
          <ChevronRight
            size={14}
            className="shrink-0 text-ink-900/40 transition-transform duration-150 group-open:rotate-90"
            aria-hidden="true"
          />
          {batch.name}
        </span>
        <span className="text-ink-900/70">
          {batch.startYear} – {batch.endYear}
        </span>
        <span className="text-ink-900/70">{batch.studentCount}</span>
        <span className="flex justify-end">
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            aria-label="Delete"
            className="rounded-sm p-1.5 text-ink-900/50 hover:bg-signal-error/10 hover:text-signal-error disabled:opacity-50"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </span>
      </summary>
      <div className="space-y-5 bg-ink-900/[0.02] px-5 py-4">
        {hasOpened && (
          <>
            <CourseAccessSection batchId={batch.id} courses={courses} />
            <StudentsTable batchId={batch.id} batchName={batch.name} />
          </>
        )}
      </div>
    </details>
  );
}

export default function BatchManagementView({
  batches,
  courses,
}: {
  batches: AdminBatchRow[];
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
          Add batch
        </button>
      )}
      {showCreate && <BatchForm onDone={() => setShowCreate(false)} courses={courses} />}

      <DashboardCard title="Batches" icon={Users} bodyClassName="p-0">
        {batches.length === 0 ? (
          <p className="p-5 text-center text-sm text-ink-900/45">
            No batches yet — add one above, then it&rsquo;ll appear when creating students.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[520px]">
              <div className="border-ink-900/8 grid grid-cols-[1fr_140px_100px_44px] gap-2 border-b px-5 py-3 text-xs font-medium uppercase tracking-wide text-ink-900/40">
                <span>Batch</span>
                <span>Years</span>
                <span>Students</span>
                <span />
              </div>
              {batches.map((b) => (
                <BatchCard key={b.id} batch={b} courses={courses} />
              ))}
            </div>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
