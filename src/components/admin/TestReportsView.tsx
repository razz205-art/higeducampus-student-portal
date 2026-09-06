"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Trash2, Upload, HelpCircle, ClipboardList, Eye } from "lucide-react";
import {
  previewTestReportUploadAction,
  publishTestReportAction,
  deleteTestReportAction,
} from "@/lib/actions/test-reports";
import type { TestReportPreviewRow } from "@/lib/actions/test-reports";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import type { TestReportSummary, TestReportType } from "@/types/test-reports";
import { TEST_REPORT_TYPES } from "@/types/test-reports";
import type { CourseOption, BatchOption } from "@/types/attendance";

const MATCH_LABEL: Record<TestReportPreviewRow["matchStatus"], string> = {
  matched: "Linked",
  not_found: "No account found",
  ambiguous: "Multiple accounts match",
};

function UploadForm({
  courses,
  batches,
  onDone,
}: {
  courses: CourseOption[];
  batches: BatchOption[];
  onDone: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [testType, setTestType] = useState<TestReportType>("WEEKLY");
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [batchId, setBatchId] = useState(batches[0]?.id ?? "");
  const [passingPercentage, setPassingPercentage] = useState("60");
  const [rows, setRows] = useState<TestReportPreviewRow[] | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<{ success: boolean; message: string } | null>(
    null
  );
  const [isPreviewPending, startPreviewTransition] = useTransition();
  const [isPublishPending, startPublishTransition] = useTransition();

  function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    setPreviewError(null);
    setPublishResult(null);
    setRows(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setPreviewError("Choose a file first.");
      return;
    }
    if (!courseId || !batchId) {
      setPreviewError("Choose a course and a batch first.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("passingPercentage", passingPercentage);
    formData.set("courseId", courseId);
    formData.set("batchId", batchId);

    startPreviewTransition(async () => {
      const res = await previewTestReportUploadAction(formData);
      if (!res.success) {
        setPreviewError(res.message ?? "Couldn't process that file.");
        return;
      }
      setRows(res.rows);
    });
  }

  function handlePublish() {
    if (!rows) return;
    startPublishTransition(async () => {
      const res = await publishTestReportAction({
        title,
        testType,
        courseId,
        batchId,
        passingPercentage: Number(passingPercentage),
        rows: rows.map((r) => ({
          rank: r.rank,
          name: r.name,
          percentage: r.percentage,
          correct: r.correct,
          incorrect: r.incorrect,
          timeRaw: r.timeRaw,
          status: r.status,
          studentId: r.studentId,
        })),
      });
      setPublishResult(res);
      if (res.success) {
        setRows(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onDone();
      }
    });
  }

  const matchedCount = rows?.filter((r) => r.matchStatus === "matched").length ?? 0;
  const unmatchedCount = rows ? rows.length - matchedCount : 0;

  return (
    <div className="space-y-4 rounded-sm border border-gold-500/30 bg-gold-500/5 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">Upload test report</p>
        <button
          type="button"
          onClick={onDone}
          className="text-xs font-medium text-ink-900/50 hover:text-ink-900"
        >
          Cancel
        </button>
      </div>

      <p className="flex items-start gap-1.5 text-xs text-ink-900/50">
        <HelpCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
        Choose the course and batch this test belongs to — only students in that batch who are
        enrolled in that course are considered when matching names from the file. Needs
        &quot;Name&quot; and &quot;Percentage&quot; columns (.csv or .xlsx). &quot;Rank&quot;,
        &quot;Correct&quot;, &quot;Incorrect&quot;, and &quot;Time&quot; columns are used if present
        — rank is otherwise worked out from percentage. Every row in the file is published as
        part of the report, even ones that don&apos;t match a student account, so class-wide
        totals stay accurate.
      </p>

      <form onSubmit={handlePreview} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Test title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Weekly Test 1"
          required
        />

        <div>
          <label htmlFor="testType" className="mb-1.5 block text-sm font-medium text-ink-800">
            Test type
          </label>
          <select
            id="testType"
            value={testType}
            onChange={(e) => setTestType(e.target.value as TestReportType)}
            required
            className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          >
            {TEST_REPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="courseId" className="mb-1.5 block text-sm font-medium text-ink-800">
            Course
          </label>
          <select
            id="courseId"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            required
            className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          >
            {courses.length === 0 && <option value="">No courses yet</option>}
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="batchId" className="mb-1.5 block text-sm font-medium text-ink-800">
            Batch
          </label>
          <select
            id="batchId"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            required
            className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          >
            {batches.length === 0 && <option value="">No batches yet</option>}
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Passing percentage"
          name="passingPercentage"
          type="number"
          min={0}
          max={100}
          step="0.1"
          value={passingPercentage}
          onChange={(e) => setPassingPercentage(e.target.value)}
          required
        />

        <div>
          <label htmlFor="testReportFile" className="mb-1.5 block text-sm font-medium text-ink-800">
            File
          </label>
          <input
            ref={fileInputRef}
            id="testReportFile"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2 text-sm text-ink-900 file:mr-3 file:rounded-sm file:border-0 file:bg-ink-900 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-parchment-50"
          />
        </div>

        {previewError && (
          <div className="sm:col-span-3">
            <Alert variant="error">{previewError}</Alert>
          </div>
        )}

        <div className="sm:col-span-3">
          <Button type="submit" isLoading={isPreviewPending} className="sm:w-auto sm:px-8">
            <Upload size={14} className="mr-1.5" aria-hidden="true" />
            Preview
          </Button>
        </div>
      </form>

      {rows && (
        <div className="space-y-3 border-t border-ink-900/10 pt-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-sm bg-signal-success/10 px-2 py-1 font-medium text-signal-success">
              {rows.length} students total
            </span>
            <span className="rounded-sm bg-signal-success/10 px-2 py-1 font-medium text-signal-success">
              {matchedCount} linked to an account
            </span>
            {unmatchedCount > 0 && (
              <span className="rounded-sm bg-gold-500/10 px-2 py-1 font-medium text-gold-600">
                {unmatchedCount} without a linked account
              </span>
            )}
          </div>

          {publishResult && (
            <Alert variant={publishResult.success ? "success" : "error"}>
              {publishResult.message}
            </Alert>
          )}

          <div className="max-h-80 overflow-y-auto rounded-sm border border-ink-900/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-parchment-50">
                <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                  <th className="px-3 py-2 font-medium">Rank</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">%</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Account</th>
                </tr>
              </thead>
              <tbody className="divide-ink-900/8 divide-y">
                {rows.map((r) => (
                  <tr key={r.rowNumber}>
                    <td className="px-3 py-2 text-ink-900/50">{r.rank}</td>
                    <td className="px-3 py-2 text-ink-900">{r.name}</td>
                    <td className="px-3 py-2 text-ink-900/70">{r.percentage}%</td>
                    <td className="px-3 py-2">
                      <Badge variant={r.status === "PASS" ? "success" : "warning"}>
                        {r.status === "PASS" ? "Pass" : "Needs Improvement"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {r.matchStatus === "matched" ? (
                        <span className="text-signal-success">{r.studentName}</span>
                      ) : (
                        <span className="text-ink-900/50">{MATCH_LABEL[r.matchStatus]}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            type="button"
            onClick={handlePublish}
            isLoading={isPublishPending}
            className="sm:w-auto sm:px-8"
          >
            Publish report ({rows.length} students)
          </Button>
        </div>
      )}
    </div>
  );
}

function testTypeLabel(t: TestReportType): string {
  return TEST_REPORT_TYPES.find((x) => x.value === t)?.label ?? t;
}

function Row({ report }: { report: TestReportSummary }) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!confirm(`Delete "${report.title}"? This removes every student's result for it.`)) return;
    startTransition(() => {
      deleteTestReportAction(report.id);
    });
  }

  return (
    <tr>
      <td className="px-5 py-3">
        <p className="flex items-center gap-1.5 font-medium text-ink-900">
          {report.title}
          <span className="rounded-sm bg-ink-900/5 px-1.5 py-0.5 text-xs font-normal text-ink-900/60">
            {testTypeLabel(report.testType)}
          </span>
        </p>
        <p className="text-xs text-ink-900/45">
          {report.courseCode} · {report.batchName} · {report.createdAt}
        </p>
      </td>
      <td className="px-5 py-3 text-ink-900/70">{report.totalStudents}</td>
      <td className="px-5 py-3 text-ink-900/70">{report.averagePercentage}%</td>
      <td className="px-5 py-3 text-ink-900/70">{report.passRate}%</td>
      <td className="px-5 py-3 text-right">
        <div className="flex justify-end gap-1.5">
          <Link
            href={`/academic-admin/test-reports/${report.id}`}
            aria-label="View report"
            className="rounded-sm p-1.5 text-ink-900/50 hover:bg-ink-900/5 hover:text-ink-900"
          >
            <Eye size={15} aria-hidden="true" />
          </Link>
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

export default function TestReportsView({
  reports,
  courses,
  batches,
}: {
  reports: TestReportSummary[];
  courses: CourseOption[];
  batches: BatchOption[];
}) {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="space-y-6">
      {!showUpload && (
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 rounded-sm bg-ink-900 px-3.5 py-2 text-xs font-medium text-parchment-50 hover:bg-ink-800"
        >
          <Plus size={14} aria-hidden="true" />
          Upload test report
        </button>
      )}
      {showUpload && (
        <UploadForm courses={courses} batches={batches} onDone={() => setShowUpload(false)} />
      )}

      <DashboardCard title="Test Reports" icon={ClipboardList} bodyClassName="p-0">
        {reports.length === 0 ? (
          <p className="p-5 text-center text-sm text-ink-900/45">No test reports uploaded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                  <th className="px-5 py-3 font-medium">Test</th>
                  <th className="px-5 py-3 font-medium">Students</th>
                  <th className="px-5 py-3 font-medium">Average</th>
                  <th className="px-5 py-3 font-medium">Pass rate</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-ink-900/8 divide-y">
                {reports.map((r) => (
                  <Row key={r.id} report={r} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
