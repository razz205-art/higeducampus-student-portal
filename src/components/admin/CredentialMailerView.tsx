"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Download,
  Mail,
  Eye,
  EyeOff,
  RotateCcw,
  FileSpreadsheet,
  History,
} from "lucide-react";
import {
  parseCredentialsFileAction,
  previewCredentialEmailAction,
  sendBulkCredentialsAction,
  recordPastSendAction,
  type CredentialRow,
  type SentRowResult,
} from "@/lib/actions/credential-mailer";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";

const DEFAULT_SUBJECT = "Your Power BI Login Credentials – Training Sessions";

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Current IST time as a value for <input type="datetime-local">. */
function nowIstLocalInput(): string {
  const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

function defaultBatchLabel(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");
  const date = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${base} – ${date}`;
}

function downloadTemplate() {
  downloadCsv("credentials-template.csv", [
    ["Name", "Username", "Password", "Email"],
    ["Aisha Khan", "aisha.k", "Hig@2026", "aisha.khan@example.com"],
    ["Rohan Verma", "rohan.v", "Hig@4821", "rohan.verma@example.com"],
  ]);
}

const fieldClass =
  "w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500";

export default function CredentialMailerView() {
  const router = useRouter();
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [batchLabel, setBatchLabel] = useState("");
  const [batchId, setBatchId] = useState<string | undefined>(undefined);

  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<CredentialRow[]>([]);
  const [results, setResults] = useState<Record<number, SentRowResult>>({});
  const [notice, setNotice] = useState<{ variant: "success" | "error"; text: string } | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [pastSentAt, setPastSentAt] = useState(nowIstLocalInput);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validRows = useMemo(() => rows.filter((r) => !r.error), [rows]);
  const invalidCount = rows.length - validRows.length;
  const sentCount = Object.values(results).filter((r) => r.status === "sent").length;
  const failedRows = validRows.filter((r) => results[r.row]?.status === "failed");
  const unsentRows = validRows.filter((r) => results[r.row]?.status !== "sent");
  const options = { subject };

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setBatchLabel(defaultBatchLabel(file.name));
    setBatchId(undefined);
    setRows([]);
    setResults({});
    setNotice(null);
    setPreviewHtml(null);
    setConfirming(false);
    setRecordOpen(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const res = await parseCredentialsFileAction(fd);
      setRows(res.rows);
      setNotice({ variant: res.success ? "success" : "error", text: res.message });
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  function handlePreview() {
    const sample = validRows[0] ?? {
      name: "Student Name",
      username: "username",
      password: "••••••",
    };
    startTransition(async () => {
      const res = await previewCredentialEmailAction(
        { name: sample.name, username: sample.username, password: sample.password },
        options
      );
      if (res.success && res.html) setPreviewHtml(res.html);
      else setNotice({ variant: "error", text: res.message });
    });
  }

  function send(target: CredentialRow[]) {
    setConfirming(false);
    startTransition(async () => {
      const res = await sendBulkCredentialsAction(
        target.map(({ row, name, username, password, email }) => ({
          row,
          name,
          username,
          password,
          email,
        })),
        options,
        { label: batchLabel, fileName: fileName ?? undefined, batchId }
      );
      if (res.batchId) setBatchId(res.batchId);
      if (res.results.length > 0) {
        setResults((prev) => {
          const next = { ...prev };
          for (const r of res.results) next[r.row] = r;
          return next;
        });
      }
      setNotice({ variant: res.success ? "success" : "error", text: res.message });
      router.refresh();
    });
  }

  function recordPast() {
    startTransition(async () => {
      const res = await recordPastSendAction(
        validRows.map(({ row, name, username, password, email }) => ({
          row,
          name,
          username,
          password,
          email,
        })),
        options,
        { label: batchLabel, fileName: fileName ?? undefined },
        // datetime-local has no zone; the admin enters India time.
        `${pastSentAt}:00+05:30`
      );
      if (res.batchId) setBatchId(res.batchId);
      if (res.results.length > 0) {
        setResults(Object.fromEntries(res.results.map((r) => [r.row, r])));
        setRecordOpen(false);
      }
      setNotice({ variant: res.success ? "success" : "error", text: res.message });
      router.refresh();
    });
  }

  function downloadResults() {
    downloadCsv(`${batchLabel || "credential-email-results"}.csv`, [
      ["Row", "Name", "Username", "Email", "Status", "Sent at", "Details"],
      ...rows.map((r) => [
        String(r.row),
        r.name,
        r.username,
        r.email,
        r.error
          ? "Skipped"
          : results[r.row]?.status === "sent"
            ? "Sent"
            : results[r.row]
              ? "Failed"
              : "Not sent",
        results[r.row] ? formatDateTime(results[r.row].sentAt) : "",
        r.error ?? results[r.row]?.message ?? "",
      ]),
    ]);
  }

  return (
    <div className="space-y-6">
      {/* Step 1 — email settings */}
      <section className="space-y-4 rounded-sm border border-ink-900/10 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink-900">1. Email settings</h2>
        </div>
        <div>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-ink-800">Email subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={handlePreview}
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs font-semibold text-gold-600 hover:underline disabled:opacity-50"
        >
          <Eye size={14} aria-hidden="true" />
          Preview email{validRows.length > 0 ? ` (using row ${validRows[0].row})` : ""}
        </button>
        {previewHtml && (
          <div className="overflow-hidden rounded-sm border border-ink-900/10">
            <div className="flex items-center justify-between border-b border-ink-900/10 bg-ink-900/[0.03] px-3 py-2 text-xs text-ink-900/60">
              <span>
                <strong>Subject:</strong> {subject}
              </span>
              <button
                type="button"
                onClick={() => setPreviewHtml(null)}
                className="hover:text-ink-900"
              >
                Close
              </button>
            </div>
            <iframe
              title="Email preview"
              srcDoc={previewHtml}
              sandbox=""
              className="h-[440px] w-full bg-white"
            />
          </div>
        )}
      </section>

      {/* Step 2 — upload */}
      <section className="space-y-4 rounded-sm border border-ink-900/10 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink-900">2. Upload the Excel file</h2>
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 text-xs font-semibold text-gold-600 hover:underline"
          >
            <Download size={14} aria-hidden="true" />
            Download template
          </button>
        </div>
        <p className="text-xs text-ink-900/60">
          The first row must be a header with these columns (any order):{" "}
          <span className="font-mono text-ink-900/80">Name, Username, Password, Email</span>. Name
          is optional. Also accepted: &ldquo;Display name&rdquo;, &ldquo;User ID&rdquo;,
          &ldquo;Login ID&rdquo;, &ldquo;Email ID&rdquo;. Extra columns (like Licenses) are ignored.
          Up to 500 rows per file. Every send is recorded in Send history below (passwords are never
          saved).
        </p>
        <input
          ref={fileInputRef}
          id="credential-file"
          type="file"
          accept=".xlsx,.csv"
          onChange={handleFile}
          className="hidden"
        />
        <label
          htmlFor="credential-file"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-sm border-2 border-dashed border-ink-900/15 px-4 py-8 text-sm text-ink-900/60 transition-colors hover:border-gold-500/40 hover:bg-gold-500/5"
        >
          {fileName ? (
            <FileSpreadsheet size={16} aria-hidden="true" />
          ) : (
            <Upload size={16} aria-hidden="true" />
          )}
          {isPending && !rows.length
            ? "Reading file…"
            : fileName
              ? `${fileName} — click to choose another`
              : "Choose a .xlsx or .csv file"}
        </label>
      </section>

      {notice && <Alert variant={notice.variant}>{notice.text}</Alert>}

      {/* Step 3 — review & send */}
      {rows.length > 0 && (
        <section className="space-y-4 rounded-sm border border-ink-900/10 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink-900">3. Review and send</h2>
              <p className="mt-0.5 text-xs text-ink-900/50">
                {validRows.length} ready
                {invalidCount > 0 && ` · ${invalidCount} will be skipped`}
                {sentCount > 0 && ` · ${sentCount} sent`}
                {failedRows.length > 0 && ` · ${failedRows.length} failed`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPasswords((s) => !s)}
                className="flex items-center gap-1 text-xs font-medium text-ink-900/60 hover:text-ink-900"
              >
                {showPasswords ? (
                  <EyeOff size={13} aria-hidden="true" />
                ) : (
                  <Eye size={13} aria-hidden="true" />
                )}
                {showPasswords ? "Hide" : "Show"} passwords
              </button>
              {Object.keys(results).length > 0 && (
                <button
                  type="button"
                  onClick={downloadResults}
                  className="flex items-center gap-1 text-xs font-medium text-ink-900/60 hover:text-ink-900"
                >
                  <Download size={13} aria-hidden="true" />
                  Download results
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[420px] overflow-auto rounded-sm border border-ink-900/10">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-ink-900/10 text-ink-900/40">
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Username</th>
                  <th className="px-3 py-2 font-medium">Password</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Sent at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-900/[0.06]">
                {rows.map((r) => {
                  const result = results[r.row];
                  return (
                    <tr key={r.row} className={r.error ? "bg-signal-error/[0.04]" : undefined}>
                      <td className="px-3 py-2 text-ink-900/50">{r.row}</td>
                      <td className="px-3 py-2 text-ink-900/80">{r.name || "—"}</td>
                      <td className="px-3 py-2 font-mono text-ink-900/80">{r.username || "—"}</td>
                      <td className="px-3 py-2 font-mono text-ink-900/80">
                        {r.password ? (showPasswords ? r.password : "••••••") : "—"}
                      </td>
                      <td className="px-3 py-2 text-ink-900/80">{r.email || "—"}</td>
                      <td className="px-3 py-2">
                        {r.error ? (
                          <Badge variant="danger">{r.error}</Badge>
                        ) : result?.status === "sent" ? (
                          <Badge variant="success">Sent</Badge>
                        ) : result?.status === "failed" ? (
                          <span title={result.message}>
                            <Badge variant="danger">Failed</Badge>
                          </span>
                        ) : (
                          <span className="text-ink-900/40">Ready</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-ink-900/50">
                        {result ? formatDateTime(result.sentAt) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {unsentRows.length > 0 && (
            <label className="block max-w-md text-sm">
              <span className="mb-1.5 block font-medium text-ink-800">
                Batch name{" "}
                <span className="font-normal text-ink-900/40">(to find this send in history)</span>
              </span>
              <input
                value={batchLabel}
                onChange={(e) => setBatchLabel(e.target.value)}
                disabled={!!batchId}
                placeholder="e.g. PBI Batch 3 – Nov 2026"
                className={`${fieldClass} disabled:bg-ink-900/[0.03] disabled:text-ink-900/60`}
              />
            </label>
          )}

          {unsentRows.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              {!confirming ? (
                <Button
                  type="button"
                  onClick={() => setConfirming(true)}
                  isLoading={isPending}
                  disabled={batchLabel.trim().length < 2}
                  className="flex items-center justify-center gap-2 sm:w-auto sm:px-8"
                >
                  {failedRows.length > 0 && failedRows.length === unsentRows.length ? (
                    <>
                      <RotateCcw size={15} aria-hidden="true" /> Retry {failedRows.length} failed
                    </>
                  ) : (
                    <>
                      <Mail size={15} aria-hidden="true" /> Send {unsentRows.length} email
                      {unsentRows.length === 1 ? "" : "s"}
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={() => send(unsentRows)}
                    isLoading={isPending}
                    className="sm:w-auto sm:px-8"
                  >
                    Confirm — email {unsentRows.length}{" "}
                    {unsentRows.length === 1 ? "person" : "people"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setConfirming(false)}
                    className="sm:w-auto sm:px-6"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          )}

          {Object.keys(results).length === 0 && validRows.length > 0 && (
            <div className="border-t border-ink-900/10 pt-4">
              {!recordOpen ? (
                <button
                  type="button"
                  onClick={() => setRecordOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-ink-900/50 hover:text-ink-900"
                >
                  <History size={13} aria-hidden="true" />
                  Already emailed this list earlier? Save it to history without sending
                </button>
              ) : (
                <div className="space-y-3 rounded-sm border border-gold-500/30 bg-gold-500/5 p-4">
                  <p className="text-sm font-semibold text-ink-900">Save to history only</p>
                  <p className="text-xs text-ink-900/60">
                    Records all {validRows.length} valid rows as <strong>Sent</strong> under the
                    batch name above. <strong>No emails will be sent.</strong> Use this only for a
                    list that was already emailed.
                  </p>
                  <label className="flex flex-wrap items-center gap-2 text-sm text-ink-800">
                    When it was sent (India time)
                    <input
                      type="datetime-local"
                      value={pastSentAt}
                      max={nowIstLocalInput()}
                      onChange={(e) => setPastSentAt(e.target.value)}
                      className={`${fieldClass} w-auto`}
                    />
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={recordPast}
                      isLoading={isPending}
                      disabled={batchLabel.trim().length < 2 || !pastSentAt}
                      className="sm:w-auto sm:px-6"
                    >
                      Save {validRows.length} to history
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setRecordOpen(false)}
                      className="sm:w-auto sm:px-4"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
