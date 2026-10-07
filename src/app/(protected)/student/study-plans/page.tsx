import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getStudentStudyPlans } from "@/lib/data/study-plans";
import StudyPlanList from "@/components/materials/StudyPlanList";

export const metadata = { title: "Study Plan" };

export default async function StudentStudyPlansPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "STUDENT" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const plans = await getStudentStudyPlans(session!.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-extrabold text-ink-900">Study Plan</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Weekly study-plan schedules for your enrolled courses.
        </p>
      </div>
      <StudyPlanList plans={plans} />
    </div>
  );
}
