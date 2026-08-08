"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function CountdownUnit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-12 w-14 overflow-hidden rounded-sm bg-ink-900 sm:h-14 sm:w-16">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={display}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center font-serif text-xl font-semibold text-parchment-50 sm:text-2xl"
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-900/45 sm:text-[11px]">
        {label}
      </span>
    </div>
  );
}
