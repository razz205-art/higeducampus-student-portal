"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { resetPasswordSchema } from "@/lib/validations/auth";

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [values, setValues] = useState({ password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = resetPasswordSchema.safeParse({ token, ...values });
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

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const data = await res.json();
    setIsLoading(false);

    if (!res.ok) {
      setFormError(data.error ?? "Something went wrong.");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (success) {
    return <Alert variant="success">Your password has been reset. Redirecting to sign in…</Alert>;
  }

  if (!token) {
    return (
      <Alert variant="error">
        This reset link is missing a token. Please request a new one from the{" "}
        <a href="/forgot-password" className="underline">
          forgot password
        </a>{" "}
        page.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <Alert variant="error">{formError}</Alert>}
      <Input
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        value={values.password}
        onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
        error={fieldErrors.password}
        required
      />
      <Input
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={(e) => setValues((v) => ({ ...v, confirmPassword: e.target.value }))}
        error={fieldErrors.confirmPassword}
        required
      />
      <p className="text-xs text-ink-900/50">
        At least 10 characters, with an uppercase letter, lowercase letter, number, and symbol.
      </p>
      <Button type="submit" isLoading={isLoading}>
        Reset password
      </Button>
    </form>
  );
}
