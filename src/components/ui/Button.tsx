import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  isLoading?: boolean;
}

const VARIANT_CLASSES: Record<string, string> = {
  primary: "bg-ink-900 text-parchment-50 hover:bg-ink-800 disabled:bg-ink-700",
  secondary: "bg-transparent border border-ink-900/20 text-ink-900 hover:bg-ink-900/5",
  ghost: "bg-transparent text-ink-900 hover:bg-ink-900/5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", isLoading, className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`w-full rounded-sm px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${VARIANT_CLASSES[variant]} ${className}`}
        {...props}
      >
        {isLoading ? "Please wait…" : children}
      </button>
    );
  }
);
Button.displayName = "Button";

export default Button;
