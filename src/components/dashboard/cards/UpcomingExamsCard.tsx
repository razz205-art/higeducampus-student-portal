import { FileClock } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { ExamItem } from "@/types/student-dashboard";

export default function UpcomingExamsCard({ items }: { items: ExamItem[] }) {
  return (
    <DashboardCard title="Upcoming Exams" icon={FileClock}>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-900/45">No exams scheduled.</p>
      ) : (
        <ul className="divide-ink-900/8 divide-y">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900">{item.courseName}</p>
                <p className="mt-0.5 text-xs text-ink-900/50">{item.examType}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-semibold text-ink-900">{item.date}</p>
                <p className="text-xs text-ink-900/50">{item.time}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
