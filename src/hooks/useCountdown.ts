"use client";

import { useEffect, useState } from "react";

export interface CountdownValue {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isPast: boolean;
  /** False until the client has mounted and computed a real value. */
  isReady: boolean;
}

const PLACEHOLDER: CountdownValue = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  totalMs: 0,
  isPast: false,
  isReady: false,
};

function computeCountdown(targetMs: number): CountdownValue {
  const totalMs = targetMs - Date.now();
  const isPast = totalMs <= 0;
  const abs = Math.max(totalMs, 0);

  return {
    days: Math.floor(abs / 86_400_000),
    hours: Math.floor((abs % 86_400_000) / 3_600_000),
    minutes: Math.floor((abs % 3_600_000) / 60_000),
    seconds: Math.floor((abs % 60_000) / 1000),
    totalMs,
    isPast,
    isReady: true,
  };
}

/**
 * Ticks every second. Any countdown depends on `Date.now()`, which differs
 * between the server-rendered HTML and the client's first render — so this
 * always starts from a static placeholder (isReady: false) and only
 * computes the real, live value inside useEffect (client-only, runs after
 * hydration). That keeps server and client markup identical on the first
 * paint and avoids a hydration-mismatch warning.
 */
export function useCountdown(targetISO: string): CountdownValue {
  const targetMs = new Date(targetISO).getTime();
  const [value, setValue] = useState<CountdownValue>(PLACEHOLDER);

  useEffect(() => {
    setValue(computeCountdown(targetMs));
    const interval = setInterval(() => setValue(computeCountdown(targetMs)), 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  return value;
}
