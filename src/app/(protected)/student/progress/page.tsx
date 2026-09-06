import { redirect } from "next/navigation";
import { Layers, ClipboardCheck, BookOpen, GraduationCap } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getStudentCourses } from "@/lib/data/attendance";
import {
  getOverallProgress,
  getClassesSummary,
  getSubjectProgress,
  getModuleProgress,
  getQuizPerformance,
  getAssignmentsSummary,
  getLearningStreak,
  getWeeklyActivity,
  getMonthlyActivity,
  getAchievements,
} from "@/lib/data/progress";
import { getTestTypeProgressForStudent } from "@/lib/data/test-reports";
import StatCard from "@/components/dashboard/cards/StatCard";
import CourseProgressCard from "@/components/dashboard/cards/CourseProgressCard";
import CourseFilterBar from "@/components/dashboard/CourseFilterBar";
import ModuleProgressCard from "@/components/progress/ModuleProgressCard";
import QuizPerformanceCard from "@/components/progress/QuizPerformanceCard";
import StreakCard from "@/components/progress/StreakCard";
import AchievementsBadgesCard from "@/components/progress/AchievementsBadgesCard";
import ActivityChart from "@/components/charts/ActivityChart";
import TestTypeProgress from "@/components/student/TestTypeProgress";

export const metadata = { title: "Progress" };

export default async function StudentProgressPage({
  searchParams,
}: {
  searchParams: { courseId?: string };
}) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "STUDENT" && role !== "SUPER_ADMIN") {
    redirect(routes.unauthorized);
  }
  const studentId = session!.user.id;

  const courses = await getStudentCourses(studentId);
  const courseId =
    searchParams.courseId && courses.some((c) => c.id === searchParams.courseId)
      ? searchParams.courseId
      : courses[0]?.id;

  const [
    overall,
    classes,
    assignments,
    subjectProgress,
    quizPerformance,
    streak,
    weekly,
    monthly,
    achievements,
    moduleProgress,
    testTypeProgress,
  ] = await Promise.all([
    getOverallProgress(studentId),
    getClassesSummary(studentId),
    getAssignmentsSummary(studentId),
    getSubjectProgress(studentId),
    getQuizPerformance(studentId, 10),
    getLearningStreak(studentId),
    getWeeklyActivity(studentId),
    getMonthlyActivity(studentId),
    getAchievements(studentId),
    courseId ? getModuleProgress(studentId, courseId) : Promise.resolve([]),
    getTestTypeProgressForStudent(studentId),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Overall Progress" value={`${overall.percentage}%`} icon={GraduationCap} />
        <StatCard label="Completed Classes" value={String(classes.completed)} icon={Layers} />
        <StatCard label="Remaining Classes" value={String(classes.remaining)} icon={BookOpen} />
        <StatCard
          label="Assignments Completed"
          value={`${assignments.completed}/${assignments.total}`}
          icon={ClipboardCheck}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CourseProgressCard
            items={subjectProgress}
            title="Subject Progress"
            icon={GraduationCap}
          />

          <div className="space-y-4">
            <CourseFilterBar
              action="/student/progress"
              courses={courses}
              selectedCourseId={courseId}
            />
            <ModuleProgressCard modules={moduleProgress} />
          </div>

          <QuizPerformanceCard rows={quizPerformance} />

          <TestTypeProgress data={testTypeProgress} />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <ActivityChart title="Weekly Activity" data={weekly} />
            <ActivityChart title="Monthly Activity" data={monthly} />
          </div>
        </div>

        <div className="space-y-6">
          <StreakCard streak={streak} />
          <AchievementsBadgesCard badges={achievements} />
        </div>
      </div>
    </div>
  );
}
