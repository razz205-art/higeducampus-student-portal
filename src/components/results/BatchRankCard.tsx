import { Award } from "lucide-react";
import type { BatchRankInfo } from "@/types/results";

export default function BatchRankCard({ rank }: { rank: BatchRankInfo | null }) {
  if (!rank) {
    return (
      <section className="rounded-sm border border-ink-900/10 bg-white p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-ink-900/5 text-ink-900/40">
            <Award size={18} aria-hidden="true" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-900/40">
            Batch Rank
          </p>
        </div>
        <p className="mt-4 text-sm text-ink-900/45">
          Rank appears once a semester result has been published.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-sm border border-ink-900/10 bg-ink-950 p-6 text-parchment-50">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-gold-500/15 text-gold-400">
          <Award size={18} aria-hidden="true" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-parchment-50/50">
          Batch Rank
        </p>
      </div>
      <p className="mt-4 font-serif text-4xl font-semibold">
        #{rank.rank}
        <span className="ml-1.5 text-base font-normal text-parchment-50/50">
          of {rank.totalStudents}
        </span>
      </p>
      <p className="mt-1 text-sm text-parchment-50/60">
        Top {Math.max(1, Math.round((rank.rank / rank.totalStudents) * 100))}% of {rank.batchName}
      </p>
    </section>
  );
}
