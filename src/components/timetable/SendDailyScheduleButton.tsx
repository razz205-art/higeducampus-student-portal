"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { sendDailyScheduleNotificationsAction } from "@/lib/actions/daily-schedule";

export default function SendDailyScheduleButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      const res = await sendDailyScheduleNotificationsAction();
      setResult(res);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-sm bg-ink-900 px-3.5 py-2 text-xs font-medium text-parchment-50 hover:bg-ink-800 disabled:opacity-50"
      >
        <Send size={14} aria-hidden="true" />
        {isPending ? "Sending…" : "Send Today's Schedule Now"}
      </button>
      {result && (
        <p
          className={`max-w-xs text-right text-xs ${
            result.success ? "text-signal-success" : "text-signal-error"
          }`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
