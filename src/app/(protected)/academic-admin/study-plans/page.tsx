import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getAllStudyPlansForAdmin } from "@/lib/data/study-plans";
import { getAllCourses } from "@/lib/data/attendance";
import StudyPlanManagementView from "@/components/admin/StudyPlanManagementView";

export const metadata = { title: "Manage Study Plans" };

export default async function AdminStudyPlansPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const [plans, courses] = await Promise.all([getAllStudyPlansForAdmin(), getAllCourses()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-extrabold text-ink-900">Manage Study Plans</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Upload each week&rsquo;s study-plan poster or PDF, course-wise — students see these grouped
          by course under Study Plan.
        </p>
      </div>
      <StudyPlanManagementView plans={plans} courses={courses} />
    </div>
  );
}
