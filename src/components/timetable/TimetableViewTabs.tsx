import Link from "next/link";

const VIEWS: { key: string; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "This Week" },
  { key: "nextweek", label: "Next Week" },
  { key: "calendar", label: "Calendar View" },
];

export default function TimetableViewTabs({
  basePath,
  active,
}: {
  basePath: string;
  active: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-sm border border-ink-900/10 bg-white p-1.5">
      {VIEWS.map((v) => (
        <Link
          key={v.key}
          href={`${basePath}?view=${v.key}`}
          className={`rounded-sm px-3.5 py-1.5 text-sm font-medium transition-colors ${
            active === v.key ? "bg-ink-900 text-parchment-50" : "text-ink-900/60 hover:bg-ink-900/5"
          }`}
        >
          {v.label}
        </Link>
      ))}
    </div>
  );
}
