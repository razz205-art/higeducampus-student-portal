import { redirect } from "next/navigation";
import {
  Users,
  Layers,
  GraduationCap,
  BookOpen,
  CalendarCheck2,
  ClipboardList,
  CalendarDays,
  Bell,
  Award,
  Library,
  FileSpreadsheet,
} from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getAdminAnalyticsOverview } from "@/lib/data/admin-analytics";
import StatCard from "@/components/dashboard/cards/StatCard";
import ManagementLinkCard from "@/components/admin/ManagementLinkCard";

export const metadata = { title: "Admin Dashboard" };

const MANAGEMENT_LINKS = [
  {
    href: "/academic-admin/students",
    title: "Students",
    description: "Accounts and status",
    icon: Users,
  },
  {
    href: "/academic-admin/batches",
    title: "Batches",
    description: "Create student cohorts",
    icon: Layers,
  },
  {
    href: "/academic-admin/faculty",
    title: "Faculty",
    description: "Create and manage accounts",
    icon: GraduationCap,
  },
  {
    href: "/academic-admin/courses",
    title: "Courses",
    description: "Catalog and faculty assignment",
    icon: BookOpen,
  },
  {
    href: "/academic-admin/attendance",
    title: "Attendance",
    description: "Sessions and records",
    icon: CalendarCheck2,
  },
  {
    href: "/academic-admin/assignments",
    title: "Assignments",
    description: "Create per course",
    icon: ClipboardList,
  },
  {
    href: "/academic-admin/timetable",
    title: "Schedules",
    description: "Weekly recurring classes",
    icon: CalendarDays,
  },
  {
    href: "/notifications",
    title: "Notifications",
    description: "Institution-wide announcements",
    icon: Bell,
  },
  {
    href: "/academic-admin/test-reports",
    title: "Test Reports",
    description: "Upload test results, view class dashboards",
    icon: FileSpreadsheet,
  },
  {
    href: "/academic-admin/materials",
    title: "Study Materials",
    description: "Documents, videos, links",
    icon: Library,
  },
  {
    href: "/academic-admin/certificates",
    title: "Certificates",
    description: "Issued certificates, revoke",
    icon: Award,
  },
];

export default async function AdminDashboardPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ACADEMIC_ADMIN" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const overview = await getAdminAnalyticsOverview();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-xl font-extrabold text-ink-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-ink-900/50">
          An overview of the institution, and everything you can manage from here.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={String(overview.totalStudents)} icon={Users} />
        <StatCard label="Faculty" value={String(overview.totalFaculty)} icon={GraduationCap} />
        <StatCard label="Courses" value={String(overview.totalCourses)} icon={BookOpen} />
        <StatCard
          label="Avg. Attendance"
          value={`${overview.avgAttendancePercent}%`}
          icon={CalendarCheck2}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-ink-900">Manage</h2>
          <a
            href="/academic-admin/analytics"
            className="text-xs font-medium text-gold-600 hover:underline"
          >
            View full analytics →
          </a>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MANAGEMENT_LINKS.map((link) => (
            <ManagementLinkCard key={link.href} {...link} />
          ))}
        </div>
      </div>
    </div>
  );
}
