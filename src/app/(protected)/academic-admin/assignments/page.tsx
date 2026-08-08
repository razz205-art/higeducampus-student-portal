import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getAllAssignmentsForAdmin } from "@/lib/data/admin-assignments";
import { getAllCourses } from "@/lib/data/attendance";
import AssignmentManagementView from "@/components/admin/AssignmentManagementView";

export const metadata = { title: "Manage Assignments" };

export default async function AdminAssignmentsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const [assignments, courses] = await Promise.all([getAllAssignmentsForAdmin(), getAllCourses()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-semibold text-ink-900">Manage Assignments</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Create assignments per course. Students track completion under Progress.
        </p>
      </div>
      <AssignmentManagementView assignments={assignments} courses={courses} />
    </div>
  );
}
