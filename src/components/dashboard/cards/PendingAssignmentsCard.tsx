import { ClipboardList } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Badge from "@/components/ui/Badge";
import type { AssignmentItem, AssignmentStatus } from "@/types/student-dashboard";

const STATUS_CONFIG: Record<
  AssignmentStatus,
  { label: string; variant: "warning" | "danger" | "info" }
> = {
  "due-soon": { label: "Due soon", variant: "warning" },
  overdue: { label: "Overdue", variant: "danger" },
  upcoming: { label: "Upcoming", variant: "info" },
};

export default function PendingAssignmentsCard({ items }: { items: AssignmentItem[] }) {
  return (
    <DashboardCard title="Pending Assignments" icon={ClipboardList}>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-900/45">Nothing pending — nice work.</p>
      ) : (
        <ul className="divide-ink-900/8 divide-y">
          {items.map((item) => {
            const status = STATUS_CONFIG[item.status];
            return (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-900/50">{item.courseName}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <p className="text-xs text-ink-900/45">Due {item.dueDate}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
