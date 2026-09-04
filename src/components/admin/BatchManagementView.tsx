"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, Users } from "lucide-react";
import {
  createBatchAction,
  deleteBatchAction,
  getBatchStudentsAction,
} from "@/lib/actions/admin-batches";
import type { BatchStudentRow } from "@/lib/actions/admin-batches";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import type { AdminBatchRow } from "@/lib/data/admin-batches";

function BatchForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await createBatchAction({
        name,
        startYear: Number(startYear),
        endYear: Number(endYear),
      });
      setResult(res);
      if (res.success) {
        onDone();
      }
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
      <Button type="submit" isLoading={isPending} className="sm:w-auto sm:px-8">
        Add batch
      </Button>
    </form>
  );
}

function StudentsList({ batchId, batchName }: { batchId: string; batchName: string }) {
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
    <tr>
      <td colSpan={4} className="bg-ink-900/[0.02] px-5 py-4">
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
      </td>
    </tr>
  );
}

function Row({ batch }: { batch: AdminBatchRow }) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  function remove(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete batch "${batch.name}"?`)) return;
    startTransition(() => {
      deleteBatchAction(batch.id);
    });
  }

  return (
    <>
      <tr
        onClick={() => setExpanded((v) => !v)}
        className="cursor-pointer hover:bg-ink-900/[0.02]"
        aria-expanded={expanded}
      >
        <td className="px-5 py-3 font-medium text-ink-900">
          <span className="flex items-center gap-1.5">
            {expanded ? (
              <ChevronDown size={14} className="text-ink-900/40" aria-hidden="true" />
            ) : (
              <ChevronRight size={14} className="text-ink-900/40" aria-hidden="true" />
            )}
            {batch.name}
          </span>
        </td>
        <td className="px-5 py-3 text-ink-900/70">
          {batch.startYear} – {batch.endYear}
        </td>
        <td className="px-5 py-3 text-ink-900/70">{batch.studentCount}</td>
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
      {expanded && <StudentsList batchId={batch.id} batchName={batch.name} />}
    </>
  );
}

export default function BatchManagementView({ batches }: { batches: AdminBatchRow[] }) {
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
      {showCreate && <BatchForm onDone={() => setShowCreate(false)} />}

      <DashboardCard title="Batches" icon={Users} bodyClassName="p-0">
        {batches.length === 0 ? (
          <p className="p-5 text-center text-sm text-ink-900/45">
            No batches yet — add one above, then it&rsquo;ll appear when creating students.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                  <th className="px-5 py-3 font-medium">Batch</th>
                  <th className="px-5 py-3 font-medium">Years</th>
                  <th className="px-5 py-3 font-medium">Students</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-ink-900/8 divide-y">
                {batches.map((b) => (
                  <Row key={b.id} batch={b} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
