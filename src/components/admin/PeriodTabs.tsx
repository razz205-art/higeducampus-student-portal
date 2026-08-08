import Link from "next/link";

export default function PeriodTabs({
  basePath,
  paramName,
  options,
  active,
}: {
  basePath: string;
  paramName: string;
  options: { value: string; label: string }[];
  active: string;
}) {
  return (
    <div className="flex gap-1 rounded-sm border border-ink-900/10 bg-white p-1">
      {options.map((opt) => (
        <Link
          key={opt.value}
          href={`${basePath}?${paramName}=${opt.value}`}
          className={`rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
            active === opt.value
              ? "bg-ink-900 text-parchment-50"
              : "text-ink-900/60 hover:bg-ink-900/5"
          }`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
