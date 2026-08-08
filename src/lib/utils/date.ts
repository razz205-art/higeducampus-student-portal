const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Postgres DATE columns have no time/timezone component. Prisma maps them
 * to JS Date objects at UTC midnight. If we ever format or compare using
 * *local* getters (getDate/getMonth) on a machine behind UTC, a stored
 * "2026-08-08" can render as Aug 7. Every helper below uses the UTC
 * getters/constructors so this module is immune to server timezone.
 */

export function toDateOnlyUTC(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

export function todayUTC(): Date {
  const now = new Date();
  return toDateOnlyUTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return toDateOnlyUTC(y!, m! - 1, d!);
}

export function formatISODate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatMonthLabel(date: Date): string {
  return `${MONTH_LABELS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatDisplayDate(date: Date): string {
  return `${MONTH_LABELS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function addMonthsUTC(date: Date, delta: number): Date {
  return toDateOnlyUTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1);
}

export function isWeekendUTC(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export interface DateRangePreset {
  key: "today" | "week" | "month" | "year";
  label: string;
  from: Date;
  to: Date;
}

/** Powers the admin report's Daily/Weekly/Monthly/Yearly quick filters. */
export function getQuickRangePresets(reference: Date = todayUTC()): DateRangePreset[] {
  const to = reference;
  const dayOfWeek = reference.getUTCDay();
  const weekStart = new Date(reference);
  weekStart.setUTCDate(reference.getUTCDate() - dayOfWeek);

  return [
    { key: "today", label: "Today", from: reference, to },
    {
      key: "week",
      label: "This Week",
      from: toDateOnlyUTC(
        weekStart.getUTCFullYear(),
        weekStart.getUTCMonth(),
        weekStart.getUTCDate()
      ),
      to,
    },
    {
      key: "month",
      label: "This Month",
      from: toDateOnlyUTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1),
      to,
    },
    { key: "year", label: "This Year", from: toDateOnlyUTC(reference.getUTCFullYear(), 0, 1), to },
  ];
}

/** "2 hours ago", "3 days ago", etc. — falls back to a short date past ~30 days. */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;

  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
