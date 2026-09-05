import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getStudentTestReports } from "@/lib/data/test-reports";
import StudentTestReportsView from "@/components/student/StudentTestReportsView";

export const metadata = { title: "My Test Results" };

export default async function StudentTestReportsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "STUDENT" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }
  const studentId = session!.user.id;

  const rows = await getStudentTestReports(studentId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-extrabold text-ink-900">My Test Results</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Your rank, score, and accuracy on each test your admin has published.
        </p>
      </div>
      <StudentTestReportsView rows={rows} />
    </div>
  );
}
