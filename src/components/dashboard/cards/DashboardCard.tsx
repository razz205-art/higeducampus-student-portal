import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function DashboardCard({
  title,
  icon: Icon,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-sm border border-ink-900/10 bg-white shadow-sm", className)}>
      {(title || action) && (
        <div className="border-ink-900/8 flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-gold-500/10 text-gold-600">
                <Icon size={15} strokeWidth={2} aria-hidden="true" />
              </span>
            )}
            {title && <h2 className="text-sm font-bold text-ink-900">{title}</h2>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
