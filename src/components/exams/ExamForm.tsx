"use client";

import { useState, useTransition } from "react";
import { PlusCircle } from "lucide-react";
import { createExamAction } from "@/lib/actions/exams";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function ExamForm() {
  const [values, setValues] = useState({ title: "", examDate: "", description: "" });
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await createExamAction(values);
      setResult(res);
      if (res.success) setValues({ title: "", examDate: "", description: "" });
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-sm border border-ink-900/10 bg-white p-5"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
        <PlusCircle size={16} aria-hidden="true" />
        Add an exam
      </div>

      {result && <Alert variant={result.success ? "success" : "error"}>{result.message}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Exam title"
          name="title"
          placeholder="e.g. CUET PG 2026"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          required
        />
        <Input
          label="Exam date & time"
          name="examDate"
          type="datetime-local"
          value={values.examDate}
          onChange={(e) => setValues((v) => ({ ...v, examDate: e.target.value }))}
          required
        />
        <div className="sm:col-span-2">
          <Input
            label="Description (optional)"
            name="description"
            placeholder="e.g. Common University Entrance Test — Postgraduate"
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          />
        </div>
      </div>

      <Button type="submit" isLoading={isPending} className="sm:w-auto sm:px-8">
        Add exam
      </Button>
    </form>
  );
}
