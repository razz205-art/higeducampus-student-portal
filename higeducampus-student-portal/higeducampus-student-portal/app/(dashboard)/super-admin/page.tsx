import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function SuperAdminDashboard() {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink-900">Super admin dashboard</h1>
      <p className="mt-2 text-sm text-ink-900/60">
        Platform-wide controls: manage user accounts and roles, review audit logs, and
        configure institution-wide settings.
      </p>
    </div>
  );
}
