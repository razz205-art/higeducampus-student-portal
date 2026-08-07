import { cn } from "@/lib/utils/cn";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "border-ink-900/15 bg-ink-900/5 text-ink-900/60",
  success: "border-signal-success/30 bg-signal-success/10 text-signal-success",
  warning: "border-gold-500/30 bg-gold-500/10 text-gold-600",
  danger: "border-signal-error/30 bg-signal-error/10 text-signal-error",
  info: "border-ink-700/20 bg-ink-700/5 text-ink-700",
};

export default function Badge({
  variant = "neutral",
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-medium",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
