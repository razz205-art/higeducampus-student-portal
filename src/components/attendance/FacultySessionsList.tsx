import { Radio } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Badge from "@/components/ui/Badge";
import type { LiveSessionRow } from "@/types/attendance";

const PLATFORM_LABEL: Record<string, string> = { ZOOM: "Zoom", GOOGLE_MEET: "Google Meet" };

export default function FacultySessionsList({ sessions }: { sessions: LiveSessionRow[] }) {
  return (
    <DashboardCard title="My Live Class Sessions" icon={Radio} bodyClassName="p-0">
      {sessions.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">
          No sessions created yet — use the form above to start one.
        </p>
      ) : (
        <ul className="divide-ink-900/8 divide-y">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900">
                  {s.subjectLabel}{" "}
                  <span className="font-normal text-ink-900/45">
                    ({s.courseCode}
                    {s.batchName ? ` · ${s.batchName}` : ""})
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-ink-900/50">
                  {s.date} at {s.startTime} · {PLATFORM_LABEL[s.platform]}
                </p>
              </div>
              <Badge variant={s.isActive ? "success" : "neutral"}>
                {s.isActive ? "Active" : "Awaiting admin"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
