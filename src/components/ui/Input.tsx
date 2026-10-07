import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", type, ...props }, ref) => {
    const inputId = id ?? props.name;
    const [revealed, setRevealed] = useState(false);
    const isPassword = type === "password";

    return (
      <div className="w-full">
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink-800">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword && revealed ? "text" : type}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={`w-full rounded-sm border bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-900/40 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 ${
              isPassword ? "pr-10" : ""
            } ${error ? "border-signal-error" : "border-ink-900/15"} ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              aria-label={revealed ? "Hide password" : "Show password"}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-900/40 hover:text-ink-900"
            >
              {revealed ? (
                <EyeOff size={16} aria-hidden="true" />
              ) : (
                <Eye size={16} aria-hidden="true" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-signal-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export default Input;
