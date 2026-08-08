"use client";

import { useState, useTransition } from "react";
import { Radio } from "lucide-react";
import { setActiveSessionAction, deactivateSessionAction } from "@/lib/actions/attendance";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Badge from "@/components/ui/Badge";
import Alert from "@/components/ui/Alert";
import type { LiveSessionRow } from "@/types/attendance";

const PLATFORM_LABEL: Record<string, string> = { ZOOM: "Zoom", GOOGLE_MEET: "Google Meet" };

export default function AdminSessionControlTable({ sessions }: { sessions: LiveSessionRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function activate(sessionId: string) {
    setPendingId(sessionId);
    setResult(null);
    startTransition(async () => {
      const res = await setActiveSessionAction(sessionId);
      setResult(res);
      setPendingId(null);
    });
  }

  function deactivate(sessionId: string) {
    setPendingId(sessionId);
    setResult(null);
    startTransition(async () => {
      const res = await deactivateSessionAction(sessionId);
      setResult(res);
      setPendingId(null);
    });
  }

  return (
    <DashboardCard
      title="Attendance Sessions"
      icon={Radio}
      bodyClassName="p-0"
      action={
        <span className="text-xs text-ink-900/45">Only one session may be active at a time</span>
      }
    >
      {result && (
        <div className="p-4 pb-0">
          <Alert variant={result.success ? "success" : "error"}>{result.message}</Alert>
        </div>
      )}

      {sessions.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">
          No live class sessions yet — faculty create these from their Attendance page.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                <th className="px-5 py-3 font-medium">Class</th>
                <th className="px-5 py-3 font-medium">Faculty</th>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-ink-900/8 divide-y">
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink-900">{s.subjectLabel}</p>
                    <p className="text-xs text-ink-900/45">
                      {s.courseCode}
                      {s.batchName ? ` · ${s.batchName}` : ""} · {PLATFORM_LABEL[s.platform]}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-ink-900/70">{s.facultyName}</td>
                  <td className="px-5 py-3 text-ink-900/70">
                    {s.date} · {s.startTime}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={s.isActive ? "success" : "neutral"}>
                      {s.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {s.isActive ? (
                      <button
                        onClick={() => deactivate(s.id)}
                        disabled={isPending}
                        className="text-xs font-medium text-signal-error hover:underline disabled:opacity-50"
                      >
                        {isPending && pendingId === s.id ? "Closing…" : "Close window"}
                      </button>
                    ) : (
                      <button
                        onClick={() => activate(s.id)}
                        disabled={isPending}
                        className="text-xs font-medium text-gold-600 hover:underline disabled:opacity-50"
                      >
                        {isPending && pendingId === s.id ? "Opening…" : "Open window"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
