"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Pencil, CalendarRange, ChevronDown, FolderOpen, ExternalLink } from "lucide-react";
import {
  createStudyPlanAction,
  deleteStudyPlanAction,
  updateStudyPlanAction,
  type ActionResult,
} from "@/lib/actions/study-plans";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import type { StudyPlanItem } from "@/lib/data/study-plans";
import type { CourseOption } from "@/types/attendance";

interface StudyPlanFormValues {
  courseId: string;
  title: string;
  weekLabel: string;
  url: string;
}

function StudyPlanFields({
  courses,
  initial,
  heading,
  submitLabel,
  clearOnSuccess,
  closeOnSuccess,
  onCancel,
  onSubmit,
}: {
  courses: CourseOption[];
  initial: StudyPlanFormValues;
  heading: string;
  submitLabel: string;
  clearOnSuccess: boolean;
  closeOnSuccess: boolean;
  onCancel: () => void;
  onSubmit: (values: StudyPlanFormValues) => Promise<ActionResult>;
}) {
  const [courseId, setCourseId] = useState(initial.courseId);
  const [title, setTitle] = useState(initial.title);
  const [weekLabel, setWeekLabel] = useState(initial.weekLabel);
  const [url, setUrl] = useState(initial.url);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await onSubmit({ courseId, title, weekLabel, url });
      setResult(res);
      if (res.success) {
        if (clearOnSuccess) {
          setTitle("");
          setWeekLabel("");
          setUrl("");
        }
        if (closeOnSuccess) {
          onCancel();
        }
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-sm border border-gold-500/30 bg-gold-500/5 p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">{heading}</p>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-ink-900/50 hover:text-ink-900"
        >
          Cancel
        </button>
      </div>
      {result && <Alert variant={result.success ? "success" : "error"}>{result.message}</Alert>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="spCourseId" className="mb-1.5 block text-sm font-medium text-ink-800">
            Course
          </label>
          <select
            id="spCourseId"
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
        <Input
          label="Week label (optional)"
          name="weekLabel"
          value={weekLabel}
          onChange={(e) => setWeekLabel(e.target.value)}
          placeholder="e.g. Week 5"
        />
        <div className="sm:col-span-2">
          <Input
            label="Title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Week 5 — Developmental Psychology Parts 3 & 4"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="URL (poster image or PDF link)"
            name="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            required
          />
        </div>
      </div>
      <Button type="submit" isLoading={isPending} className="sm:w-auto sm:px-8">
        {submitLabel}
      </Button>
    </form>
  );
}

function CreateStudyPlanForm({
  courses,
  onDone,
}: {
  courses: CourseOption[];
  onDone: () => void;
}) {
  return (
    <StudyPlanFields
      courses={courses}
      initial={{ courseId: courses[0]?.id ?? "", title: "", weekLabel: "", url: "" }}
      heading="Add study plan"
      submitLabel="Add study plan"
      clearOnSuccess
      closeOnSuccess={false}
      onCancel={onDone}
      onSubmit={(values) =>
        createStudyPlanAction({
          courseId: values.courseId,
          title: values.title,
          weekLabel: values.weekLabel.trim() || undefined,
          url: values.url,
        })
      }
    />
  );
}

function EditStudyPlanForm({
  plan,
  courses,
  onDone,
}: {
  plan: StudyPlanItem;
  courses: CourseOption[];
  onDone: () => void;
}) {
  return (
    <StudyPlanFields
      courses={courses}
      initial={{
        courseId: plan.courseId,
        title: plan.title,
        weekLabel: plan.weekLabel ?? "",
        url: plan.url,
      }}
      heading="Edit study plan"
      submitLabel="Save changes"
      clearOnSuccess={false}
      closeOnSuccess
      onCancel={onDone}
      onSubmit={(values) =>
        updateStudyPlanAction(plan.id, {
          courseId: values.courseId,
          title: values.title,
          weekLabel: values.weekLabel.trim() || undefined,
          url: values.url,
        })
      }
    />
  );
}

function Row({ plan, courses }: { plan: StudyPlanItem; courses: CourseOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  function remove() {
    if (!confirm(`Remove "${plan.title}"?`)) return;
    startTransition(() => {
      deleteStudyPlanAction(plan.id);
    });
  }

  if (isEditing) {
    return (
      <tr>
        <td colSpan={4} className="bg-gold-500/5 p-4">
          <EditStudyPlanForm plan={plan} courses={courses} onDone={() => setIsEditing(false)} />
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="px-5 py-3">
        <p className="font-medium text-ink-900">{plan.title}</p>
        {plan.weekLabel && (
          <span className="mt-1 inline-block rounded-sm bg-gold-500/15 px-1.5 py-0.5 text-xs font-medium text-gold-700">
            {plan.weekLabel}
          </span>
        )}
      </td>
      <td className="px-5 py-3 text-ink-900/70">{plan.createdAt}</td>
      <td className="px-5 py-3">
        <a
          href={plan.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-gold-600 hover:underline"
        >
          <ExternalLink size={12} aria-hidden="true" />
          Open
        </a>
      </td>
      <td className="px-5 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setIsEditing(true)}
            aria-label="Edit"
            className="rounded-sm p-1.5 text-ink-900/50 hover:bg-ink-900/5 hover:text-ink-900"
          >
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button
            onClick={remove}
            disabled={isPending}
            aria-label="Delete"
            className="rounded-sm p-1.5 text-ink-900/50 hover:bg-signal-error/10 hover:text-signal-error disabled:opacity-50"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}

interface CourseGroup {
  courseId: string;
  courseCode: string;
  courseName: string;
  plans: StudyPlanItem[];
}

function groupByCourse(plans: StudyPlanItem[]): CourseGroup[] {
  const map = new Map<string, CourseGroup>();
  for (const p of plans) {
    if (!map.has(p.courseId)) {
      map.set(p.courseId, {
        courseId: p.courseId,
        courseCode: p.courseCode,
        courseName: p.courseName,
        plans: [],
      });
    }
    map.get(p.courseId)!.plans.push(p);
  }
  return Array.from(map.values()).sort((a, b) => a.courseCode.localeCompare(b.courseCode));
}

function CourseSection({
  group,
  isExpanded,
  onToggle,
  courses,
}: {
  group: CourseGroup;
  isExpanded: boolean;
  onToggle: () => void;
  courses: CourseOption[];
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 bg-ink-900/[0.03] px-5 py-3 text-left transition-colors hover:bg-ink-900/[0.05]"
      >
        <span className="flex items-center gap-2.5">
          <FolderOpen size={15} className="text-gold-600" aria-hidden="true" />
          <span className="text-sm font-semibold text-ink-900">
            {group.courseCode} — {group.courseName}
          </span>
          <span className="text-xs text-ink-900/40">
            {group.plans.length} plan{group.plans.length === 1 ? "" : "s"}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-ink-900/40 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                <th className="px-5 py-3 font-medium">Study Plan</th>
                <th className="px-5 py-3 font-medium">Added</th>
                <th className="px-5 py-3 font-medium">Link</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-ink-900/8 divide-y">
              {group.plans.map((p) => (
                <Row key={p.id} plan={p} courses={courses} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function StudyPlanManagementView({
  plans,
  courses,
}: {
  plans: StudyPlanItem[];
  courses: CourseOption[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [courseFilter, setCourseFilter] = useState("all");
  const [collapsedCourseIds, setCollapsedCourseIds] = useState<Set<string>>(new Set());

  const visiblePlans =
    courseFilter === "all" ? plans : plans.filter((p) => p.courseId === courseFilter);
  const groups = groupByCourse(visiblePlans);

  return (
    <div className="space-y-6">
      {!showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-sm bg-ink-900 px-3.5 py-2 text-xs font-medium text-parchment-50 hover:bg-ink-800"
        >
          <Plus size={14} aria-hidden="true" />
          Add study plan
        </button>
      )}
      {showCreate && <CreateStudyPlanForm courses={courses} onDone={() => setShowCreate(false)} />}

      <div className="flex items-center gap-2">
        <label htmlFor="studyPlanCourseFilter" className="text-xs font-medium text-ink-900/50">
          Course
        </label>
        <select
          id="studyPlanCourseFilter"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="rounded-sm border border-ink-900/15 bg-white px-3 py-1.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
        >
          <option value="all">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      </div>

      <DashboardCard title="Study Plans" icon={CalendarRange} bodyClassName="p-0">
        {groups.length === 0 ? (
          <p className="p-5 text-center text-sm text-ink-900/45">No study plans added yet.</p>
        ) : (
          <div className="divide-ink-900/8 divide-y">
            {groups.map((group) => (
              <CourseSection
                key={group.courseId}
                group={group}
                isExpanded={!collapsedCourseIds.has(group.courseId)}
                onToggle={() =>
                  setCollapsedCourseIds((current) => {
                    const next = new Set(current);
                    if (next.has(group.courseId)) {
                      next.delete(group.courseId);
                    } else {
                      next.add(group.courseId);
                    }
                    return next;
                  })
                }
                courses={courses}
              />
            ))}
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
