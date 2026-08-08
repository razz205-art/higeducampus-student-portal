import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getAllCertificatesForAdmin } from "@/lib/data/certificates";
import CertificateManagementTable from "@/components/admin/CertificateManagementTable";

export const metadata = { title: "Manage Certificates" };

export default async function AdminCertificatesPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const certificates = await getAllCertificatesForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-semibold text-ink-900">Manage Certificates</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Every certificate students have issued for themselves. Revoking one immediately
          invalidates its QR verification link.
        </p>
      </div>
      <CertificateManagementTable certificates={certificates} />
    </div>
  );
}
