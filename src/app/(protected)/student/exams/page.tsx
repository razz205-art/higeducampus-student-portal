import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getActiveExams } from "@/lib/data/exams";
import ExamCountdownGrid from "@/components/exams/ExamCountdownGrid";

export const metadata = { title: "Exam Countdown" };

export default async function StudentExamsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "STUDENT" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const exams = await getActiveExams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-semibold text-ink-900">Exam Countdown</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Live countdowns to CUET PG, UGC NET, and internal mock tests. Dates are set by your
          administrator.
        </p>
      </div>
      <ExamCountdownGrid exams={exams} />
    </div>
  );
}
