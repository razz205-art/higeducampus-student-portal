import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getAllBatchesForAdmin } from "@/lib/data/admin-batches";
import BatchManagementView from "@/components/admin/BatchManagementView";

export const metadata = { title: "Manage Batches" };

export default async function AdminBatchesPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const batches = await getAllBatchesForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-extrabold text-ink-900">Manage Batches</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Create student batches (e.g. graduating cohorts) — needed before you can assign a batch
          when creating a student account.
        </p>
      </div>
      <BatchManagementView batches={batches} />
    </div>
  );
}
