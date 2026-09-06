import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
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
      <div className="flex items-center justify-between">
        <Link
          href="/academic-admin/test-reports"
          className="flex items-center gap-1.5 text-sm font-medium text-ink-900/60 hover:text-ink-900"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to Test Reports
        </Link>
        
          href={`/api/test-reports/${report.id}/pdf`}
          className="flex items-center gap-1.5 rounded-sm bg-ink-900 px-3.5 py-2 text-xs font-medium text-parchment-50 hover:bg-ink-800"
        >
          <Download size={14} aria-hidden="true" />
          Download Report
        </a>
      </div>
      <TestReportDetail report={report} />
    </div>
  );
}
