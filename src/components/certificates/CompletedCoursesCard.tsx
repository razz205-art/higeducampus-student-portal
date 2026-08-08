import { CheckCircle2 } from "lucide-react";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import IssueCertificateButton from "@/components/certificates/IssueCertificateButton";
import type { CompletedCourseItem } from "@/types/certificate";

export default function CompletedCoursesCard({ courses }: { courses: CompletedCourseItem[] }) {
  return (
    <DashboardCard title="Completed Courses" icon={CheckCircle2} bodyClassName="p-0">
      {courses.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">
          No courses fully completed yet — certificates unlock at 100% progress.
        </p>
      ) : (
        <ul className="divide-ink-900/8 divide-y">
          {courses.map((course) => (
            <li key={course.courseId} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900">
                  {course.courseCode} — {course.courseName}
                </p>
                <p className="mt-0.5 text-xs text-signal-success">100% complete</p>
              </div>
              <IssueCertificateButton
                courseId={course.courseId}
                initialCertificateId={course.certificateId}
              />
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
