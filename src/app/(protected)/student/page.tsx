import { redirect } from "next/navigation";
import { CalendarCheck2, ClipboardList, LineChart, Percent } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getStudentDashboardData } from "@/lib/data/student-dashboard";
import { getStudentMaterials } from "@/lib/data/materials";
import { getQuoteOfTheDay } from "@/lib/data/quotes";
import ProfileSummaryCard from "@/components/dashboard/cards/ProfileSummaryCard";
import StatCard from "@/components/dashboard/cards/StatCard";
import CourseProgressCard from "@/components/dashboard/cards/CourseProgressCard";
import PerformanceChart from "@/components/dashboard/cards/PerformanceChart";
import UpcomingClassesCard from "@/components/dashboard/cards/UpcomingClassesCard";
import UpcomingExamsCard from "@/components/dashboard/cards/UpcomingExamsCard";
import PendingAssignmentsCard from "@/components/dashboard/cards/PendingAssignmentsCard";
import LatestNotificationsCard from "@/components/dashboard/cards/LatestNotificationsCard";
import RecentActivitiesCard from "@/components/dashboard/cards/RecentActivitiesCard";
import MotivationQuoteCard from "@/components/dashboard/cards/MotivationQuoteCard";
import QuickActionsCard from "@/components/dashboard/cards/QuickActionsCard";
import MaterialList from "@/components/materials/MaterialList";

export const metadata = { title: "Dashboard" };

export default async function StudentDashboard() {
  const session = await auth();
  const role = session?.user?.role;

  // Defense in depth: middleware already enforces this.
  if (role !== "STUDENT" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }

  const data = await getStudentDashboardData(session!.user.id);
  const materials = await getStudentMaterials(session!.user.id);
  const quote = getQuoteOfTheDay();

  return (
    <div className="space-y-6">
      <ProfileSummaryCard
        name={session!.user.name}
        image={session!.user.image}
        profile={data.profile}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Attendance"
          value={`${data.stats.attendancePercent}%`}
          icon={Percent}
          hint="This semester"
        />
        <StatCard
          label="Overall Progress"
          value={`${data.stats.overallProgressPercent}%`}
          icon={LineChart}
          hint="Across all courses"
        />
        <StatCard
          label="Pending Assignments"
          value={String(data.stats.pendingAssignmentsCount)}
          icon={ClipboardList}
          hint="Needs your attention"
        />
        <StatCard
          label="Upcoming Exams"
          value={String(data.stats.upcomingExamsCount)}
          icon={CalendarCheck2}
          hint="In the next 3 weeks"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <MaterialList materials={materials.slice(0, 4)} />
          <CourseProgressCard items={data.courseProgress} />
          <PerformanceChart data={data.performance} />
          <UpcomingClassesCard items={data.upcomingClasses} />
          <UpcomingExamsCard items={data.upcomingExams} />
          <PendingAssignmentsCard items={data.pendingAssignments} />
          <RecentActivitiesCard items={data.recentActivities} />
        </div>

        <div className="space-y-6">
          <MotivationQuoteCard quote={quote} />
          <QuickActionsCard />
          <LatestNotificationsCard items={data.notifications} />
        </div>
      </div>
    </div>
  );
}
