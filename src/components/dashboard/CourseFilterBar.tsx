import type { CourseOption } from "@/types/progress";

export default function CourseFilterBar({
  action,
  courses,
  selectedCourseId,
}: {
  action: string;
  courses: CourseOption[];
  selectedCourseId?: string;
}) {
  return (
    <form
      method="GET"
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-sm border border-ink-900/10 bg-white p-4 shadow-sm"
    >
      <div>
        <label htmlFor="courseId" className="mb-1 block text-xs font-medium text-ink-900/60">
          Course
        </label>
        <select
          id="courseId"
          name="courseId"
          defaultValue={selectedCourseId ?? ""}
          className="rounded-sm border border-ink-900/15 bg-white px-3 py-2 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded-sm bg-ink-900 px-4 py-2 text-sm font-medium text-parchment-50 transition-colors hover:bg-ink-800"
      >
        View modules
      </button>
    </form>
  );
}
