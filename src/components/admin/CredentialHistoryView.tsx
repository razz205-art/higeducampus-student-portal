"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronDown, ChevronRight, Download, History, Search } from "lucide-react";
import {
  getCredentialBatchRecipientsAction,
  searchCredentialRecipientsAction,
  type CredentialBatchSummary,
  type CredentialRecipientMatch,
  type CredentialRecipientRecord,
} from "@/lib/actions/credential-mailer";
import Badge from "@/components/ui/Badge";

const fieldClass =
  "w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-900/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500";

const IST = "Asia/Kolkata";

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    timeZone: IST,
    hour: "numeric",
    minute: "2-digit",
  });
}
/** YYYY-MM-DD in IST — used both for grouping and for the date filters. */
function istDateKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: IST });
}
function fmtDateHeading(key: string) {
  return new Date(`${key}T12:00:00+05:30`).toLocaleDateString("en-IN", {
    timeZone: IST,
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

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

function StatusBadge({ status, error }: { status: "SENT" | "FAILED"; error: string | null }) {
  return status === "SENT" ? (
    <Badge variant="success">Sent</Badge>
  ) : (
    <span title={error ?? undefined}>
      <Badge variant="danger">Failed</Badge>
    </span>
  );
}

function RecipientsTable({ rows }: { rows: CredentialRecipientRecord[] }) {
  return (
    <div className="max-h-[420px] overflow-auto rounded-sm border border-ink-900/10">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-white">
          <tr className="border-b border-ink-900/10 text-ink-900/40">
            <th className="px-3 py-2 font-medium">Row</th>
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Username</th>
            <th className="px-3 py-2 font-medium">Email</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Sent at</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-900/[0.06]">
          {rows.map((r) => (
            <tr key={r.rowNumber}>
              <td className="px-3 py-2 text-ink-900/50">{r.rowNumber}</td>
              <td className="px-3 py-2 text-ink-900/80">{r.name || "—"}</td>
              <td className="px-3 py-2 font-mono text-ink-900/80">{r.username}</td>
              <td className="px-3 py-2 text-ink-900/80">{r.email}</td>
              <td className="px-3 py-2">
                <StatusBadge status={r.status} error={r.error} />
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-ink-900/50">
                {fmtDateTime(r.sentAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BatchCard({ batch }: { batch: CredentialBatchSummary }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CredentialRecipientRecord[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && rows === null) {
      startTransition(async () => {
        const res = await getCredentialBatchRecipientsAction(batch.id);
        setRows(res.recipients);
      });
    }
  }

  function download() {
    const go = (list: CredentialRecipientRecord[]) =>
      downloadCsv(`${batch.label}.csv`, [
        ["Batch", "Row", "Name", "Username", "Email", "Status", "Sent at", "Details"],
        ...list.map((r) => [
          batch.label,
          String(r.rowNumber),
          r.name,
          r.username,
          r.email,
          r.status === "SENT" ? "Sent" : "Failed",
          fmtDateTime(r.sentAt),
          r.error ?? "",
        ]),
      ]);
    if (rows) go(rows);
    else
      startTransition(async () => {
        const res = await getCredentialBatchRecipientsAction(batch.id);
        setRows(res.recipients);
        go(res.recipients);
      });
  }

  return (
    <div className="rounded-sm border border-ink-900/10">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={toggle}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown size={16} className="shrink-0 text-ink-900/40" aria-hidden="true" />
          ) : (
            <ChevronRight size={16} className="shrink-0 text-ink-900/40" aria-hidden="true" />
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink-900">{batch.label}</span>
            <span className="block truncate text-xs text-ink-900/50">
              {fmtTime(batch.createdAt)}
              {batch.sentByName && ` · by ${batch.sentByName}`}
              {batch.fileName && ` · ${batch.fileName}`}
            </span>
          </span>
        </button>
        <div className="flex items-center gap-2">
          <Badge variant="success">{batch.sent} sent</Badge>
          {batch.failed > 0 && <Badge variant="danger">{batch.failed} failed</Badge>}
          <button
            type="button"
            onClick={download}
            disabled={isPending}
            className="flex items-center gap-1 text-xs font-medium text-ink-900/60 hover:text-ink-900 disabled:opacity-50"
          >
            <Download size={13} aria-hidden="true" />
            CSV
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-ink-900/10 p-3">
          {rows === null ? (
            <p className="px-1 py-2 text-xs text-ink-900/50">Loading…</p>
          ) : (
            <>
              <p className="mb-2 px-1 text-xs text-ink-900/50">Subject: {batch.subject}</p>
              <RecipientsTable rows={rows} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function CredentialHistoryView({ batches }: { batches: CredentialBatchSummary[] }) {
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [personQuery, setPersonQuery] = useState("");
  const [matches, setMatches] = useState<CredentialRecipientMatch[] | null>(null);
  const [personMessage, setPersonMessage] = useState("");
  const [isSearching, startSearch] = useTransition();

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = batches.filter((b) => {
      const key = istDateKey(b.createdAt);
      if (from && key < from) return false;
      if (to && key > to) return false;
      if (
        q &&
        !b.label.toLowerCase().includes(q) &&
        !(b.fileName ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
    const map = new Map<string, CredentialBatchSummary[]>();
    for (const b of filtered) {
      const key = istDateKey(b.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return Array.from(map.entries()); // already newest first
  }, [batches, search, from, to]);

  function findPerson(e: React.FormEvent) {
    e.preventDefault();
    startSearch(async () => {
      const res = await searchCredentialRecipientsAction(personQuery);
      setMatches(res.matches);
      setPersonMessage(res.message);
    });
  }

  const hasFilters = search || from || to;

  return (
    <section className="space-y-4 rounded-sm border border-ink-900/10 bg-white p-5">
      <div className="flex items-center gap-2">
        <History size={16} className="text-ink-900/60" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-ink-900">Send history</h2>
        <span className="text-xs text-ink-900/40">
          {batches.length} send{batches.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Find one person across all sends */}
      <form onSubmit={findPerson} className="flex flex-wrap gap-2">
        <input
          value={personQuery}
          onChange={(e) => setPersonQuery(e.target.value)}
          placeholder="Find a student by name, username or email…"
          className={`${fieldClass} min-w-[220px] flex-1`}
        />
        <button
          type="submit"
          disabled={isSearching || personQuery.trim().length < 2}
          className="flex items-center gap-1.5 rounded-sm bg-ink-900 px-4 py-2 text-sm font-semibold text-parchment-50 hover:bg-ink-800 disabled:opacity-50"
        >
          <Search size={14} aria-hidden="true" />
          {isSearching ? "Searching…" : "Find"}
        </button>
        {matches !== null && (
          <button
            type="button"
            onClick={() => {
              setMatches(null);
              setPersonQuery("");
              setPersonMessage("");
            }}
            className="px-2 text-xs font-medium text-ink-900/50 hover:text-ink-900"
          >
            Clear
          </button>
        )}
      </form>
      {matches !== null && (
        <div className="space-y-2">
          {personMessage && <p className="text-xs text-ink-900/50">{personMessage}</p>}
          {matches.length > 0 && (
            <div className="max-h-[320px] overflow-auto rounded-sm border border-gold-500/30 bg-gold-500/5">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ink-900/10 text-ink-900/40">
                    <th className="px-3 py-2 font-medium">Batch</th>
                    <th className="px-3 py-2 font-medium">Row</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Username</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Sent at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-900/[0.06]">
                  {matches.map((m) => (
                    <tr key={`${m.batchId}-${m.rowNumber}`}>
                      <td className="px-3 py-2 font-medium text-ink-900/80">{m.batchLabel}</td>
                      <td className="px-3 py-2 text-ink-900/50">{m.rowNumber}</td>
                      <td className="px-3 py-2 text-ink-900/80">{m.name || "—"}</td>
                      <td className="px-3 py-2 font-mono text-ink-900/80">{m.username}</td>
                      <td className="px-3 py-2 text-ink-900/80">{m.email}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={m.status} error={m.error} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-ink-900/50">
                        {fmtDateTime(m.sentAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Batch / date filters */}
      <div className="grid gap-3 border-t border-ink-900/10 pt-4 sm:grid-cols-[1fr_auto_auto_auto]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by batch name or file…"
          className={fieldClass}
        />
        <label className="flex items-center gap-2 text-xs text-ink-900/50">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-ink-900/50">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={fieldClass}
          />
        </label>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFrom("");
              setTo("");
            }}
            className="px-2 text-xs font-medium text-ink-900/50 hover:text-ink-900"
          >
            Reset
          </button>
        ) : (
          <span />
        )}
      </div>

      {batches.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-900/40">
          No sends yet — they&apos;ll appear here after you send your first batch.
        </p>
      ) : groups.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-900/40">No sends match these filters.</p>
      ) : (
        <div className="space-y-5">
          {groups.map(([dateKey, list]) => (
            <div key={dateKey} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-900/50">
                {fmtDateHeading(dateKey)}
                <span className="ml-2 font-normal normal-case tracking-normal text-ink-900/40">
                  {list.length} send{list.length === 1 ? "" : "s"} ·{" "}
                  {list.reduce((n, b) => n + b.sent, 0)} emails
                </span>
              </h3>
              {list.map((b) => (
                <BatchCard key={b.id} batch={b} />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
