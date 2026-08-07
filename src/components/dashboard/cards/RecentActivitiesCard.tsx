import { History } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { ActivityItem } from "@/types/student-dashboard";

export default function RecentActivitiesCard({ items }: { items: ActivityItem[] }) {
  return (
    <DashboardCard title="Recent Activities" icon={History}>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-900/45">No recent activity yet.</p>
      ) : (
        <ol className="space-y-4">
          {items.map((item, i) => (
            <li key={item.id} className="relative flex gap-3 pl-1">
              <div className="flex flex-col items-center">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full border-2 border-gold-500 bg-white"
                  aria-hidden="true"
                />
                {i < items.length - 1 && (
                  <span className="w-px flex-1 bg-ink-900/10" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 pb-1">
                <p className="text-sm text-ink-900">{item.description}</p>
                <p className="mt-0.5 text-xs text-ink-900/45">{item.timestamp}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </DashboardCard>
  );
}
