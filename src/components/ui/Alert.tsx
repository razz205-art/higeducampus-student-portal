interface AlertProps {
  variant: "error" | "success";
  children: React.ReactNode;
}

export default function Alert({ variant, children }: AlertProps) {
  const styles =
    variant === "error"
      ? "bg-signal-error/10 text-signal-error border-signal-error/30"
      : "bg-signal-success/10 text-signal-success border-signal-success/30";

  return (
    <div role="alert" className={`rounded-sm border px-3 py-2.5 text-sm ${styles}`}>
      {children}
    </div>
  );
}
