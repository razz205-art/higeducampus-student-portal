import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getAllMaterialsForAdmin } from "@/lib/data/materials";
import { getAllCourses } from "@/lib/data/attendance";
import { getShareLinksForAdmin } from "@/lib/data/material-share";
import ShareMaterialsView from "@/components/admin/ShareMaterialsView";

export const metadata = { title: "Share Study Materials" };

export default async function ShareMaterialsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const [materials, courses, links] = await Promise.all([
    getAllMaterialsForAdmin(),
    getAllCourses(),
    getShareLinksForAdmin(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-extrabold text-ink-900">Share Study Materials</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Create a link to selected study materials that anyone can open without logging in to the
          portal. Turn a link off or delete it at any time.
        </p>
      </div>
      <ShareMaterialsView materials={materials} courses={courses} links={links} />
    </div>
  );
}
