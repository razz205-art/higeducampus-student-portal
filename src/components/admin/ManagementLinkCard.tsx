import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export default function ManagementLinkCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3.5 rounded-sm border border-ink-900/10 bg-white p-4 transition-colors hover:border-gold-500/40 hover:bg-gold-500/[0.03]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-gold-500/10 text-gold-600 transition-colors group-hover:bg-gold-500/20">
        <Icon size={18} strokeWidth={2} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-900">{title}</p>
        <p className="mt-0.5 text-xs text-ink-900/50">{description}</p>
      </div>
    </Link>
  );
}
