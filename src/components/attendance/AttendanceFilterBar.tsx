import type { CourseOption } from "@/types/attendance";

export default function AttendanceFilterBar({
  action,
  courses,
  selectedCourseId,
  allowAllCourses = true,
  date,
  extraHiddenFields,
}: {
  action: string;
  courses: CourseOption[];
  selectedCourseId?: string;
  allowAllCourses?: boolean;
  /** Include a date input when provided */
  date?: string;
  extraHiddenFields?: Record<string, string>;
}) {
  return (
    <form
      method="GET"
      action={action}
      className="flex flex-wrap items-end gap-3 rounded-sm border border-ink-900/10 bg-white p-4 shadow-sm"
    >
      {extraHiddenFields &&
        Object.entries(extraHiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

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
          {allowAllCourses && <option value="">All courses</option>}
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      </div>

      {date !== undefined && (
        <div>
          <label htmlFor="date" className="mb-1 block text-xs font-medium text-ink-900/60">
            Date
          </label>
          <input
            id="date"
            type="date"
            name="date"
            defaultValue={date}
            className="rounded-sm border border-ink-900/15 bg-white px-3 py-2 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
        </div>
      )}

      <button
        type="submit"
        className="rounded-sm bg-ink-900 px-4 py-2 text-sm font-medium text-parchment-50 transition-colors hover:bg-ink-800"
      >
        Apply
      </button>
    </form>
  );
}
