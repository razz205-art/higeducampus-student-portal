"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email.");
      return;
    }

    setIsLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
    } finally {
      setIsLoading(false);
      // Always show the same confirmation state, regardless of response,
      // so the UI never reveals whether the email is registered.
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <Alert variant="success">
        If an account exists for <strong>{email}</strong>, we&rsquo;ve sent a link to reset the
        password. The link expires in 30 minutes.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      <Input
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" isLoading={isLoading}>
        Send reset link
      </Button>
    </form>
  );
}
