import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getAllExamsForAdmin } from "@/lib/data/exams";
import ExamForm from "@/components/exams/ExamForm";
import ExamManagementTable from "@/components/exams/ExamManagementTable";

export const metadata = { title: "Exam Management" };

export default async function AdminExamsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const exams = await getAllExamsForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-extrabold text-ink-900">
          Exam Countdown Management
        </h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Add exams, change their dates, and archive ones that have passed. Students see live
          countdowns for every active exam at /student/exams.
        </p>
      </div>
      <ExamForm />
      <ExamManagementTable exams={exams} />
    </div>
  );
}
