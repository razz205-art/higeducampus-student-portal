import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function StudentDashboard() {
  const session = await auth();
  const role = session?.user?.role;

  // Defense in depth: middleware already enforces this, this is a second check.
  if (role !== "STUDENT" && role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink-900">
        Welcome back, {session?.user?.name?.split(" ")[0] ?? "Student"}
      </h1>
      <p className="mt-2 text-sm text-ink-900/60">
        This is the student dashboard. Course enrollment, grades, and campus announcements
        will surface here.
      </p>
    </div>
  );
}
