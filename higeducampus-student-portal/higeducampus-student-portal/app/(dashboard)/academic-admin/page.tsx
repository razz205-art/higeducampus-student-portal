import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AcademicAdminDashboard() {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink-900">Academic admin dashboard</h1>
      <p className="mt-2 text-sm text-ink-900/60">
        Manage departments, course catalogs, and faculty assignments from here.
      </p>
    </div>
  );
}
