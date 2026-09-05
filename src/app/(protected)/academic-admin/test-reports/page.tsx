import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getTestReportsForAdmin } from "@/lib/data/test-reports";
import TestReportsView from "@/components/admin/TestReportsView";

export const metadata = { title: "Test Reports" };

export default async function AdminTestReportsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const reports = await getTestReportsForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-extrabold text-ink-900">Test Reports</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Upload a weekly test, quiz, or mock exam's results as a spreadsheet and get a full
          class dashboard — rankings, pass rate, score distribution — automatically.
        </p>
      </div>
      <TestReportsView reports={reports} />
    </div>
  );
}
