"use client";

import { useState, useTransition } from "react";
import { History } from "lucide-react";
import type { AttendanceStatus } from "@prisma/client";
import { updateAttendanceRecordAction } from "@/lib/actions/attendance";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";

const STATUS_OPTIONS: AttendanceStatus[] = ["PRESENT", "ABSENT", "LEAVE"];

interface Row {
  id: string;
  date: string;
  studentName: string;
  status: AttendanceStatus;
}

function RecordRow({ record }: { record: Row }) {
  const [status, setStatus] = useState<AttendanceStatus>(record.status);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleChange(next: AttendanceStatus) {
    setStatus(next);
    setSaved(false);
    startTransition(async () => {
      const res = await updateAttendanceRecordAction({ recordId: record.id, status: next });
      if (res.success) setSaved(true);
    });
  }

  return (
    <tr>
      <td className="whitespace-nowrap px-5 py-3 text-ink-900/70">{record.date}</td>
      <td className="px-5 py-3 text-ink-900">{record.studentName}</td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <select
            value={status}
            disabled={isPending}
            onChange={(e) => handleChange(e.target.value as AttendanceStatus)}
            className="rounded-sm border border-ink-900/15 bg-white px-2 py-1 text-xs text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:opacity-60"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          {isPending && <span className="text-xs text-ink-900/40">Saving…</span>}
          {!isPending && saved && <span className="text-xs text-signal-success">Saved</span>}
        </div>
      </td>
    </tr>
  );
}

export default function AdminRecentRecordsEditor({ records }: { records: Row[] }) {
  return (
    <DashboardCard title="Recent Records" icon={History} bodyClassName="p-0">
      {records.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">No records for this course yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-ink-900/8 divide-y">
              {records.map((r) => (
                <RecordRow key={r.id} record={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
