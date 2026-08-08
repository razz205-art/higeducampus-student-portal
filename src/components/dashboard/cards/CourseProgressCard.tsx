import { BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import type { CourseProgressItem } from "@/types/student-dashboard";

export default function CourseProgressCard({
  items,
  title = "Course Progress",
  icon = BarChart3,
}: {
  items: CourseProgressItem[];
  title?: string;
  icon?: LucideIcon;
}) {
  return (
    <DashboardCard title={title} icon={icon}>
      <ul className="space-y-4">
        {items.map((course) => (
          <li key={course.id}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-ink-900">
                <span className="font-medium">{course.courseCode}</span>
                <span className="text-ink-900/50"> — {course.courseName}</span>
              </span>
              <span className="shrink-0 font-medium text-ink-900/70">
                {course.progressPercent}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={course.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${course.courseName} progress`}
              className="bg-ink-900/8 h-2 w-full overflow-hidden rounded-full"
            >
              <div
                className="h-full rounded-full bg-gold-500"
                style={{ width: `${course.progressPercent}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
