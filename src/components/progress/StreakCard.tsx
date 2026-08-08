import { Flame } from "lucide-react";
import type { LearningStreak } from "@/types/progress";

export default function StreakCard({ streak }: { streak: LearningStreak }) {
  return (
    <section className="rounded-sm border border-ink-900/10 bg-ink-950 p-6 text-parchment-50 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-gold-500/15 text-gold-400">
          <Flame size={18} aria-hidden="true" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-parchment-50/50">
          Learning Streak
        </p>
      </div>

      <p className="mt-4 font-serif text-4xl font-semibold">
        {streak.current}
        <span className="ml-1.5 text-base font-normal text-parchment-50/50">
          day{streak.current === 1 ? "" : "s"}
        </span>
      </p>
      <p className="mt-1 text-sm text-parchment-50/60">
        {streak.activeToday
          ? "You're active today — keep it going."
          : streak.current > 0
            ? "Keep your streak alive — come back today."
            : "Complete a lesson, quiz, or assignment to start a streak."}
      </p>

      <div className="mt-4 border-t border-white/10 pt-4 text-sm text-parchment-50/60">
        Longest streak: <span className="font-medium text-parchment-50">{streak.longest} days</span>
      </div>
    </section>
  );
}
