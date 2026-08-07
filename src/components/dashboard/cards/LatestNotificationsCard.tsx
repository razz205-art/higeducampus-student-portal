import { BellRing } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { NotificationItem } from "@/types/student-dashboard";

export default function LatestNotificationsCard({ items }: { items: NotificationItem[] }) {
  return (
    <DashboardCard title="Latest Notifications" icon={BellRing}>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-900/45">You&rsquo;re all caught up.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex gap-2.5">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-sm leading-snug text-ink-900">{item.title}</p>
                <p className="mt-0.5 text-xs text-ink-900/45">{item.timestamp}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
