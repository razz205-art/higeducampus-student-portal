"use client";

import { motion } from "framer-motion";
import { CalendarClock, Sparkles } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import CountdownUnit from "@/components/exams/CountdownUnit";
import type { ExamItem } from "@/types/exam";

function formatExamDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ExamCountdownCard({ exam, index }: { exam: ExamItem; index: number }) {
  const countdown = useCountdown(exam.examDate);
  const isUrgent =
    countdown.isReady && !countdown.isPast && countdown.totalMs < 24 * 60 * 60 * 1000;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-sm border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
        isUrgent ? "border-gold-500/50" : "border-ink-900/10"
      }`}
    >
      {isUrgent && (
        <motion.div
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold-500/20 via-transparent to-transparent"
          aria-hidden="true"
        />
      )}

      <div className="relative">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3 className="font-serif text-lg font-semibold text-ink-900">{exam.title}</h3>
          {isUrgent && (
            <span className="flex shrink-0 items-center gap-1 rounded-sm bg-gold-500/15 px-2 py-0.5 text-[11px] font-medium text-gold-600">
              <Sparkles size={11} aria-hidden="true" />
              Soon
            </span>
          )}
        </div>

        {exam.description && <p className="mb-3 text-sm text-ink-900/55">{exam.description}</p>}

        <p className="mb-4 flex items-center gap-1.5 text-xs text-ink-900/45">
          <CalendarClock size={13} aria-hidden="true" />
          {formatExamDate(exam.examDate)}
        </p>

        {countdown.isReady && countdown.isPast ? (
          <div className="rounded-sm bg-ink-900/5 px-4 py-3 text-center text-sm font-medium text-ink-900/60">
            This exam has concluded
          </div>
        ) : (
          <div className="flex justify-center gap-2.5 sm:gap-3">
            <CountdownUnit value={countdown.days} label="Days" />
            <CountdownUnit value={countdown.hours} label="Hours" />
            <CountdownUnit value={countdown.minutes} label="Min" />
            <CountdownUnit value={countdown.seconds} label="Sec" />
          </div>
        )}
      </div>
    </motion.section>
  );
}
