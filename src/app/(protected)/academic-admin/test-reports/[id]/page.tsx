import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getTestReportDetail } from "@/lib/data/test-reports";
import TestReportDetail from "@/components/admin/TestReportDetail";

export const metadata = { title: "Test Report" };

export default async function AdminTestReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const report = await getTestReportDetail(params.id);
  if (!report) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/academic-admin/test-reports"
        className="flex items-center gap-1.5 text-sm font-medium text-ink-900/60 hover:text-ink-900"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to Test Reports
      </Link>
      <TestReportDetail report={report} />
    </div>
  );
}
