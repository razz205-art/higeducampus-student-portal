export default function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
            {eyebrow}
          </p>
          <h1 className="font-serif text-2xl font-semibold text-parchment-50">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-parchment-50/60">{subtitle}</p>}
        </div>
        <div className="rounded-sm border border-white/10 bg-parchment-50 p-8 shadow-2xl">
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm text-parchment-50/60">{footer}</div>}
      </div>
    </div>
  );
}
