import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getAllMaterialsForAdmin } from "@/lib/data/materials";
import { getAllCourses } from "@/lib/data/attendance";
import MaterialManagementView from "@/components/admin/MaterialManagementView";

export const metadata = { title: "Manage Study Materials" };

export default async function AdminMaterialsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const [materials, courses] = await Promise.all([getAllMaterialsForAdmin(), getAllCourses()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-semibold text-ink-900">Manage Study Materials</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Share documents, videos, and links per course. Files are linked by URL — no upload storage
          is configured in this project.
        </p>
      </div>
      <MaterialManagementView materials={materials} courses={courses} />
    </div>
  );
}
