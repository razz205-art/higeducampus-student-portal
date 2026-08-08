import {
  Flame,
  Trophy,
  Target,
  BookOpen,
  Star,
  Medal,
  Zap,
  Crown,
  Award,
  type LucideIcon,
} from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { Badge, BadgeIconKey } from "@/types/progress";

const ICONS: Record<BadgeIconKey, LucideIcon> = {
  flame: Flame,
  trophy: Trophy,
  target: Target,
  book: BookOpen,
  star: Star,
  medal: Medal,
  zap: Zap,
  crown: Crown,
};

export default function AchievementsBadgesCard({ badges }: { badges: Badge[] }) {
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <DashboardCard
      title="Achievements & Badges"
      icon={Award}
      action={
        <span className="text-xs font-medium text-ink-900/45">
          {earnedCount}/{badges.length} earned
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {badges.map((badge) => {
          const Icon = ICONS[badge.icon];
          return (
            <div
              key={badge.id}
              title={badge.description}
              className={`flex flex-col items-center gap-2 rounded-sm border p-3.5 text-center ${
                badge.earned
                  ? "border-gold-500/30 bg-gold-500/10"
                  : "border-ink-900/10 bg-ink-900/[0.02] opacity-50"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  badge.earned ? "bg-gold-500/20 text-gold-600" : "bg-ink-900/5 text-ink-900/30"
                }`}
              >
                <Icon size={17} strokeWidth={2} aria-hidden="true" />
              </span>
              <span
                className={`text-xs font-medium leading-snug ${
                  badge.earned ? "text-ink-900" : "text-ink-900/40"
                }`}
              >
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
