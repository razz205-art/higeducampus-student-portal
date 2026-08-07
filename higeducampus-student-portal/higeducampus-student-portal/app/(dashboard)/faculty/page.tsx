import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function FacultyDashboard() {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "FACULTY" && role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink-900">Faculty dashboard</h1>
      <p className="mt-2 text-sm text-ink-900/60">
        Manage your course rosters, grade submissions, and office hours from here.
      </p>
    </div>
  );
}
