import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getStudentAssignments } from "@/lib/data/assignments";
import AssignmentList from "@/components/assignments/AssignmentList";

export const metadata = { title: "Assignments" };

export default async function StudentAssignmentsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "STUDENT" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const assignments = await getStudentAssignments(session!.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-xl font-extrabold text-ink-900">Assignments</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Instructions and reference material from your instructors, and your own submissions.
        </p>
      </div>
      <AssignmentList items={assignments} />
    </div>
  );
}
