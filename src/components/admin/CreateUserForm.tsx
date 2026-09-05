"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { createUserAction } from "@/lib/actions/admin-users";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import type { BatchOption, CourseOption } from "@/types/attendance";

export default function CreateUserForm({
  role,
  batches,
  courses,
}: {
  role: "STUDENT" | "FACULTY";
  batches: BatchOption[];
  courses: CourseOption[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [sendEmail, setSendEmail] = useState(true);
  const [customMessage, setCustomMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function toggleBatch(batchId: string) {
    setBatchIds((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
    );
  }

  function toggleCourse(courseId: string) {
    setCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await createUserAction({
        name,
        email,
        password,
        role,
        batchIds: role === "STUDENT" ? batchIds : undefined,
        courseIds: role === "STUDENT" ? courseIds : undefined,
        sendEmail,
        customMessage: customMessage || undefined,
      });
      setResult(res);
      if (res.success) {
        setName("");
        setEmail("");
        setPassword("");
        setBatchIds([]);
        setCourseIds([]);
        setCustomMessage("");
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
      </div>

      {role === "STUDENT" && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-800">
            Batches <span className="font-normal text-ink-900/40">(optional — can select more than one)</span>
          </p>
          {batches.length === 0 ? (
            <p className="rounded-sm border border-ink-900/15 bg-white px-3 py-2.5 text-sm text-ink-900/45">
              No batches yet — create one under Manage &rarr; Batches first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {batches.map((b) => {
                const checked = batchIds.includes(b.id);
                return (
                  <label
                    key={b.id}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-xs ${
                      checked
                        ? "border-gold-500 bg-gold-500/10 text-ink-900"
                        : "border-ink-900/15 bg-white text-ink-900/70 hover:border-ink-900/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBatch(b.id)}
                      className="h-3.5 w-3.5 accent-gold-500"
                    />
                    {b.name}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {role === "STUDENT" && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-800">
            Courses{" "}
            <span className="font-normal text-ink-900/40">(optional — can also add later)</span>
          </p>
          {courses.length === 0 ? (
            <p className="rounded-sm border border-ink-900/15 bg-white px-3 py-2.5 text-sm text-ink-900/45">
              No courses yet — create one under Manage &rarr; Courses first.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 rounded-sm border border-ink-900/15 bg-white p-3 sm:grid-cols-2">
              {courses.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm text-ink-900/80">
                  <input
                    type="checkbox"
                    checked={courseIds.includes(c.id)}
                    onChange={() => toggleCourse(c.id)}
                    className="rounded border-ink-900/25"
                  />
                  {c.code} — {c.name}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2.5 rounded-sm border border-ink-900/10 bg-white p-3">
        <label className="flex items-center gap-2 text-sm text-ink-900/80">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="rounded border-ink-900/25"
          />
          Email login details to this account
        </label>
        {sendEmail && (
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Optional custom message to include in the email…"
            rows={3}
            className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2 text-sm placeholder:text-ink-900/30"
          />
        )}
      </div>

      <Button type="submit" isLoading={isPending} className="sm:w-auto sm:px-8">
        Create account
      </Button>
    </form>
  );
}
