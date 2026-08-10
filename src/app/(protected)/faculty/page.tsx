import { redirect } from "next/navigation";
import { BookOpen, Users, CalendarCheck2, CalendarDays } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getFacultyDashboardData } from "@/lib/data/faculty-dashboard";
import StatCard from "@/components/dashboard/cards/StatCard";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import TimetableClassRow from "@/components/timetable/TimetableClassRow";
import ManagementLinkCard from "@/components/admin/ManagementLinkCard";

export const metadata = { title: "Faculty Dashboard" };

export default async function FacultyDashboardPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "FACULTY" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const data = await getFacultyDashboardData(session!.user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-xl font-extrabold text-ink-900">Faculty Dashboard</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          Welcome back, {session!.user.name ?? "there"}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Courses" value={String(data.courseCount)} icon={BookOpen} />
        <StatCard label="Students" value={String(data.totalStudents)} icon={Users} />
        <StatCard
          label="Classes Today"
          value={String(data.todaysClasses.length)}
          icon={CalendarDays}
        />
      </div>

      <DashboardCard title="Today's Classes" icon={CalendarCheck2}>
        {data.todaysClasses.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-900/45">No classes scheduled today.</p>
        ) : (
          <div className="space-y-3">
            {data.todaysClasses.map((c) => (
              <TimetableClassRow key={c.id} item={c} />
            ))}
          </div>
        )}
      </DashboardCard>

      <div>
        <h2 className="mb-3 font-serif text-lg font-bold text-ink-900">Manage</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ManagementLinkCard
            href="/faculty/attendance"
            title="Attendance"
            description="Live sessions and roster entry"
            icon={CalendarCheck2}
          />
          <ManagementLinkCard
            href="/faculty/timetable"
            title="Timetable"
            description="Your weekly teaching schedule"
            icon={CalendarDays}
          />
        </div>
      </div>
    </div>
  );
}
