import { BookOpen, CalendarCheck, MessageSquareText, UploadCloud, Zap } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Badge from "@/components/ui/Badge";

const ACTIONS = [
  { label: "View Courses", icon: BookOpen },
  { label: "Submit Assignment", icon: UploadCloud },
  { label: "Check Attendance", icon: CalendarCheck },
  { label: "Message Faculty", icon: MessageSquareText },
];

/**
 * Every action is disabled with a "Soon" badge — the underlying modules
 * (courses, assignment submission, attendance, messaging) don't exist yet.
 * Wire each button up to a real route as its module ships.
 */
export default function QuickActionsCard() {
  return (
    <DashboardCard title="Quick Actions" icon={Zap}>
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map(({ label, icon: Icon }) => (
          <span
            key={label}
            aria-disabled="true"
            className="flex cursor-not-allowed flex-col items-start gap-2 rounded-sm border border-ink-900/10 p-3.5 text-ink-900/40"
          >
            <Icon size={18} strokeWidth={2} aria-hidden="true" />
            <span className="text-xs font-medium leading-snug">{label}</span>
            <Badge variant="neutral">Soon</Badge>
          </span>
        ))}
      </div>
    </DashboardCard>
  );
}
