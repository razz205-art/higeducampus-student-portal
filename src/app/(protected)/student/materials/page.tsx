import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getStudentMaterials } from "@/lib/data/materials";
import MaterialList from "@/components/materials/MaterialList";

export const metadata = { title: "View Course" };

export default async function StudentMaterialsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "STUDENT" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const materials = await getStudentMaterials(session!.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-extrabold text-ink-900">View Course</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Chapters, documents, videos, and links for your enrolled courses.
        </p>
      </div>
      <MaterialList materials={materials} />
    </div>
  );
}
