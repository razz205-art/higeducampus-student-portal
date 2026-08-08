import { Download } from "lucide-react";

const FORMATS: { format: "csv" | "xlsx" | "pdf"; label: string }[] = [
  { format: "csv", label: "CSV" },
  { format: "xlsx", label: "Excel" },
  { format: "pdf", label: "PDF" },
];

export default function ExportButtonGroup({ baseHref }: { baseHref: string }) {
  const separator = baseHref.includes("?") ? "&" : "?";

  return (
    <div className="inline-flex overflow-hidden rounded-sm border border-ink-900/15 bg-white">
      <span className="flex items-center gap-1.5 border-r border-ink-900/10 px-3 text-xs font-medium text-ink-900/50">
        <Download size={13} aria-hidden="true" />
        Export
      </span>
      {FORMATS.map(({ format, label }, i) => (
        <a
          key={format}
          href={`${baseHref}${separator}format=${format}`}
          className={`px-3 py-2 text-xs font-medium text-ink-900 transition-colors hover:bg-ink-900/5 ${
            i > 0 ? "border-l border-ink-900/10" : ""
          }`}
        >
          {label}
        </a>
      ))}
    </div>
  );
}
