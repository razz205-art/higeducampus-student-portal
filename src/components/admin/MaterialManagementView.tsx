"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Library } from "lucide-react";
import { createMaterialAction, deleteMaterialAction } from "@/lib/actions/materials";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import type { MaterialItem } from "@/lib/data/materials";
import type { CourseOption } from "@/types/attendance";

function MaterialForm({ courses, onDone }: { courses: CourseOption[]; onDone: () => void }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"DOCUMENT" | "VIDEO" | "LINK">("DOCUMENT");
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await createMaterialAction({
        courseId,
        title,
        description: description || undefined,
        type,
        url,
      });
      setResult(res);
      if (res.success) {
        setTitle("");
        setDescription("");
        setUrl("");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-sm border border-gold-500/30 bg-gold-500/5 p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">Add study material</p>
        <button
          type="button"
          onClick={onDone}
          className="text-xs font-medium text-ink-900/50 hover:text-ink-900"
        >
          Cancel
        </button>
      </div>
      {result && <Alert variant={result.success ? "success" : "error"}>{result.message}</Alert>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="courseId" className="mb-1.5 block text-sm font-medium text-ink-800">
            Course
          </label>
          <select
            id="courseId"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-ink-800">
            Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as "DOCUMENT" | "VIDEO" | "LINK")}
            className="w-full rounded-sm border border-ink-900/15 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          >
            <option value="DOCUMENT">Document</option>
            <option value="VIDEO">Video</option>
            <option value="LINK">Link</option>
          </select>
        </div>
        <Input
          label="Title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Input
          label="URL"
          name="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          required
        />
        <div className="sm:col-span-2">
          <Input
            label="Description (optional)"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      <Button type="submit" isLoading={isPending} className="sm:w-auto sm:px-8">
        Add material
      </Button>
    </form>
  );
}

function Row({ material }: { material: MaterialItem }) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!confirm(`Remove "${material.title}"?`)) return;
    startTransition(() => {
      deleteMaterialAction(material.id);
    });
  }

  return (
    <tr>
      <td className="px-5 py-3">
        <p className="font-medium text-ink-900">{material.title}</p>
        <p className="text-xs text-ink-900/45">{material.courseCode}</p>
      </td>
      <td className="px-5 py-3 text-ink-900/70">{material.type}</td>
      <td className="px-5 py-3 text-ink-900/70">{material.createdAt}</td>
      <td className="px-5 py-3 text-right">
        <button
          onClick={remove}
          disabled={isPending}
          aria-label="Delete"
          className="rounded-sm p-1.5 text-ink-900/50 hover:bg-signal-error/10 hover:text-signal-error disabled:opacity-50"
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}

export default function MaterialManagementView({
  materials,
  courses,
}: {
  materials: MaterialItem[];
  courses: CourseOption[];
}) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      {!showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-sm bg-ink-900 px-3.5 py-2 text-xs font-medium text-parchment-50 hover:bg-ink-800"
        >
          <Plus size={14} aria-hidden="true" />
          Add material
        </button>
      )}
      {showCreate && <MaterialForm courses={courses} onDone={() => setShowCreate(false)} />}

      <DashboardCard title="Study Materials" icon={Library} bodyClassName="p-0">
        {materials.length === 0 ? (
          <p className="p-5 text-center text-sm text-ink-900/45">No materials added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                  <th className="px-5 py-3 font-medium">Material</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Added</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-ink-900/8 divide-y">
                {materials.map((m) => (
                  <Row key={m.id} material={m} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
