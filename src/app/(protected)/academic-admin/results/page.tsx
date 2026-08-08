import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getAllSemesterResultsForAdmin, getStudentOptions } from "@/lib/data/admin-results";
import { getAllCourses } from "@/lib/data/attendance";
import SemesterResultManagementView from "@/components/admin/SemesterResultManagementView";

export const metadata = { title: "Manage Results" };

export default async function AdminResultsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const [results, students, courses] = await Promise.all([
    getAllSemesterResultsForAdmin(),
    getStudentOptions(),
    getAllCourses(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-semibold text-ink-900">Manage Results</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Publish official semester results. Internal assessments, mock tests, and assignment scores
          are managed separately (seeded for now — no authoring UI yet).
        </p>
      </div>
      <SemesterResultManagementView results={results} students={students} courses={courses} />
    </div>
  );
}
