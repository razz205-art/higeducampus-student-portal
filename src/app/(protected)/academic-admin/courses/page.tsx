import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getAllCoursesForAdmin, getFacultyOptions } from "@/lib/data/admin-courses";
import CourseManagementView from "@/components/admin/CourseManagementView";

export const metadata = { title: "Manage Courses" };

export default async function AdminCoursesPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const [courses, faculty] = await Promise.all([getAllCoursesForAdmin(), getFacultyOptions()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-extrabold text-ink-900">Manage Courses</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Create courses and assign the faculty member who teaches each one.
        </p>
      </div>
      <CourseManagementView courses={courses} faculty={faculty} />
    </div>
  );
}
