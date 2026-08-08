"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { createUserAction } from "@/lib/actions/admin-users";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import type { BatchOption } from "@/types/attendance";

export default function CreateUserForm({
  role,
  batches,
}: {
  role: "STUDENT" | "FACULTY";
  batches: BatchOption[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [batchId, setBatchId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await createUserAction({
        name,
        email,
        password,
        role,
        batchId: role === "STUDENT" ? batchId || undefined : undefined,
      });
      setResult(res);
      if (res.success) {
        setName("");
        setEmail("");
        setPassword("");
        setBatchId("");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-sm border border-gold-500/30 bg-gold-500/5 p-5"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
        <UserPlus size={16} aria-hidden="true" />
        Add {role === "STUDENT" ? "a student" : "a faculty member"}
      </div>

      {result && <Alert variant={result.success ? "success" : "error"}>{result.message}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email address"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Temporary password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {role === "STUDENT" && (
          <div>
            <label htmlFor="batchId" className="mb-1.5 block text-sm font-medium text-ink-800">
              Batch <span className="font-normal text-ink-900/40">(optional)</span>
            </label>
            <select
              id="batchId"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            >
              <option value="">No batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Button type="submit" isLoading={isPending} className="sm:w-auto sm:px-8">
        Create account
      </Button>
    </form>
  );
}
