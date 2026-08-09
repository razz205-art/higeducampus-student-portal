"use client";

import { useRef, useState, useTransition } from "react";
import { Users, Copy, Check, Upload } from "lucide-react";
import {
  bulkCreateStudentsAction,
  bulkCreateStudentsFromFileAction,
  type BulkRowResult,
} from "@/lib/actions/admin-users";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";

const EXAMPLE = `Aisha Khan, aisha.khan@example.com, , 2025 - 2029
Rohan Verma, rohan.verma@example.com, MyPassword123!, 2025 - 2029
Priya Nair, priya.nair@example.com`;

function parseRows(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return {
        name: parts[0] ?? "",
        email: parts[1] ?? "",
        password: parts[2] || undefined,
        batchName: parts[3] || undefined,
      };
    });
}

function CopyPasswordButton({ email, password }: { email: string; password: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(`${email} / ${password}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-1 text-xs font-medium text-gold-600 hover:underline"
    >
      {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
      {password}
    </button>
  );
}

export default function BulkAddStudentsForm({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [outcome, setOutcome] = useState<{
    message: string;
    results: BulkRowResult[];
  } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rows = parseRows(text);
    if (rows.length === 0) return;
    startTransition(async () => {
      const res = await bulkCreateStudentsAction(rows);
      setOutcome({ message: res.message, results: res.results });
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setOutcome(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await bulkCreateStudentsFromFileAction(formData);
      setOutcome({ message: res.message, results: res.results });
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  return (
    <div className="space-y-4 rounded-sm border border-gold-500/30 bg-gold-500/5 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Users size={16} aria-hidden="true" />
          Bulk add students
        </div>
        <button
          type="button"
          onClick={onDone}
          className="text-xs font-medium text-ink-900/50 hover:text-ink-900"
        >
          Close
        </button>
      </div>

      <div className="rounded-sm border border-ink-900/10 bg-white p-3 text-xs text-ink-900/60">
        <p className="font-medium text-ink-900/80">One student per line:</p>
        <p className="mt-1 font-mono">Full Name, Email, Password (optional), Batch (optional)</p>
        <p className="mt-2">
          Leave password blank to auto-generate one — shown after you submit, so you can copy and
          share it. Batch must already exist (created under Batches) and match its name exactly. For
          file uploads, an optional header row (e.g. &ldquo;Name, Email, …&rdquo;) is detected
          automatically and skipped.
        </p>
        <pre className="mt-2 whitespace-pre-wrap rounded-sm bg-ink-900/[0.03] p-2 font-mono text-[11px] text-ink-900/50">
          {EXAMPLE}
        </pre>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder={EXAMPLE}
          className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2.5 font-mono text-xs text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
        <Button
          type="submit"
          isLoading={isPending}
          disabled={parseRows(text).length === 0}
          className="sm:w-auto sm:px-8"
        >
          Add {parseRows(text).length || ""} student{parseRows(text).length === 1 ? "" : "s"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-ink-900/10" />
        <span className="text-xs font-medium text-ink-900/40">or upload a file</span>
        <div className="h-px flex-1 bg-ink-900/10" />
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
          id="bulk-file-input"
        />
        <label
          htmlFor="bulk-file-input"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-sm border-2 border-dashed border-ink-900/15 bg-white px-4 py-6 text-sm text-ink-900/60 transition-colors hover:border-gold-500/40 hover:bg-gold-500/5"
        >
          <Upload size={16} aria-hidden="true" />
          {fileName
            ? `Uploaded: ${fileName}`
            : "Choose a .csv or .xlsx file (same column order as above)"}
        </label>
      </div>

      {outcome && (
        <div className="space-y-3">
          <Alert variant="success">{outcome.message}</Alert>
          <div className="overflow-x-auto rounded-sm border border-ink-900/10 bg-white">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-ink-900/8 border-b text-ink-900/40">
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-ink-900/8 divide-y">
                {outcome.results.map((r) => (
                  <tr key={r.row}>
                    <td className="px-3 py-2 text-ink-900/60">{r.row}</td>
                    <td className="px-3 py-2 text-ink-900/80">{r.email}</td>
                    <td className="px-3 py-2">
                      <Badge variant={r.status === "created" ? "success" : "danger"}>
                        {r.status === "created" ? "Created" : "Skipped"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-ink-900/60">
                      {r.password ? (
                        <CopyPasswordButton email={r.email} password={r.password} />
                      ) : (
                        r.message
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
