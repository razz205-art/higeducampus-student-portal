"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import GoogleButton from "@/components/auth/GoogleButton";
import { loginSchema } from "@/lib/validations/auth";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Incorrect email or password.",
  ACCOUNT_LOCKED:
    "This account is temporarily locked due to repeated failed attempts. Try again in 15 minutes.",
  ACCOUNT_DISABLED: "This account has been disabled. Contact your administrator.",
  default: "Something went wrong. Please try again.",
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [values, setValues] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errors[issue.path[0] as string] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsLoading(true);

    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
      callbackUrl,
    });

    setIsLoading(false);

    if (result?.error) {
      setFormError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.default);
      return;
    }

    router.push(result?.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {formError && <Alert variant="error">{formError}</Alert>}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          error={fieldErrors.email}
          required
        />
        <div>
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
            error={fieldErrors.password}
            required
          />
          <div className="mt-1.5 text-right">
            <a
              href="/forgot-password"
              className="text-xs font-medium text-ink-800 hover:text-gold-600"
            >
              Forgot password?
            </a>
          </div>
        </div>

        <Button type="submit" isLoading={isLoading}>
          Sign in
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-ink-900/10" />
        <span className="text-xs text-ink-900/40">OR</span>
        <div className="h-px flex-1 bg-ink-900/10" />
      </div>

      <GoogleButton callbackUrl={callbackUrl} />
    </div>
  );
}
