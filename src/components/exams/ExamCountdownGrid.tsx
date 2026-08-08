import { CalendarX2 } from "lucide-react";
import ExamCountdownCard from "@/components/exams/ExamCountdownCard";
import type { ExamItem } from "@/types/exam";

export default function ExamCountdownGrid({ exams }: { exams: ExamItem[] }) {
  if (exams.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-sm border border-ink-900/10 bg-white p-12 text-center">
        <CalendarX2 size={24} className="text-ink-900/25" aria-hidden="true" />
        <p className="text-sm font-medium text-ink-900/60">No upcoming exams scheduled</p>
        <p className="text-xs text-ink-900/40">Check back soon, or ask your administrator.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {exams.map((exam, i) => (
        <ExamCountdownCard key={exam.id} exam={exam} index={i} />
      ))}
    </div>
  );
}
