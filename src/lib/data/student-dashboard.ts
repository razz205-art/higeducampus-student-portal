import { prisma } from "@/lib/db/prisma";
import { getStudentCourses, getStudentAttendanceSummary } from "@/lib/data/attendance";
import { getOverallProgress, getSubjectProgress, getAssignmentsSummary } from "@/lib/data/progress";
import { getActiveExams } from "@/lib/data/exams";
import { getStudentTimetableSlots, projectWeek } from "@/lib/data/timetable";
import { getRecentSummaries } from "@/lib/data/notifications";
import { getResultsPerformanceTrend } from "@/lib/data/results";
import { formatDayLabel, getWeekStartUTC, parseISODate, todayUTC } from "@/lib/utils/date";
import type {
  StudentDashboardData,
  AssignmentStatus,
  ActivityItem,
} from "@/types/student-dashboard";

function formatExamTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatExamDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Real Prisma queries, reusing functions already built across the
 * Attendance/Progress/Timetable/Exams/Notifications/Results modules —
 * this used to be hardcoded mock data (see git history), a deliberate
 * placeholder from the very first dashboard build before those modules
 * existed. They've all since shipped; this is the promised swap-over.
 */
export async function getStudentDashboardData(userId: string): Promise<StudentDashboardData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      registrationNumber: true,
      batch: { select: { name: true, startYear: true, endYear: true } },
    },
  });

  const [
    attendanceSummary,
    overallProgress,
    subjectProgress,
    assignmentsSummary,
    activeExams,
    timetableSlots,
    notifications,
    performanceTrend,
    courses,
  ] = await Promise.all([
    getStudentAttendanceSummary(userId),
    getOverallProgress(userId),
    getSubjectProgress(userId),
    getAssignmentsSummary(userId),
    getActiveExams(),
    getStudentTimetableSlots(userId),
    getRecentSummaries(userId, 5),
    getResultsPerformanceTrend(userId, 6),
    getStudentCourses(userId),
  ]);

  // Upcoming classes: this week's remaining slots, soonest first.
  const week = projectWeek(timetableSlots, getWeekStartUTC(todayUTC()));
  const upcomingClasses = week
    .flatMap((day) => day.classes)
    .filter((c) => c.status !== "completed")
    .slice(0, 4)
    .map((c) => ({
      id: c.id,
      courseName: `${c.courseCode} — ${c.courseName}`,
      instructor: c.facultyName,
      day: formatDayLabel(parseISODate(c.date)),
      time: `${c.startTime} – ${c.endTime}`,
      location: c.location ?? (c.meetingLink ? "Online" : "TBA"),
    }));

  const upcomingExams = activeExams.slice(0, 4).map((e) => ({
    id: e.id,
    courseName: e.title,
    examType: "Exam",
    date: formatExamDate(e.examDate),
    time: formatExamTime(e.examDate),
  }));

  // Pending assignments: assignments in enrolled courses the student hasn't submitted yet.
  const courseIds = courses.map((c) => c.id);
  const today = todayUTC();
  const allAssignments =
    courseIds.length > 0
      ? await prisma.assignment.findMany({
          where: { courseId: { in: courseIds } },
          include: {
            course: { select: { code: true, name: true } },
            submissions: { where: { studentId: userId }, select: { id: true } },
          },
          orderBy: { dueDate: "asc" },
        })
      : [];
  const pendingAssignments = allAssignments
    .filter((a: { submissions: { id: string }[] }) => a.submissions.length === 0)
    .slice(0, 5)
    .map(
      (a: { id: string; title: string; dueDate: Date; course: { code: string; name: string } }) => {
        const daysUntil = Math.round((a.dueDate.getTime() - today.getTime()) / 86_400_000);
        const status: AssignmentStatus =
          daysUntil < 0 ? "overdue" : daysUntil <= 3 ? "due-soon" : "upcoming";
        return {
          id: a.id,
          title: a.title,
          courseName: `${a.course.code} — ${a.course.name}`,
          dueDate: formatExamDate(a.dueDate.toISOString()),
          status,
        };
      }
    );

  // Recent activity: the student's own last few lesson completions, quiz
  // attempts, and assignment submissions, merged and sorted by recency.
  const [completions, quizzes, submissions] = await Promise.all([
    prisma.lessonCompletion.findMany({
      where: { studentId: userId },
      include: { lesson: { select: { title: true } } },
      orderBy: { completedAt: "desc" },
      take: 5,
    }),
    prisma.quizAttempt.findMany({
      where: { studentId: userId },
      include: { quiz: { select: { title: true } } },
      orderBy: { takenAt: "desc" },
      take: 5,
    }),
    prisma.assignmentSubmission.findMany({
      where: { studentId: userId },
      include: { assignment: { select: { title: true } } },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
  ]);
  const recentActivities: ActivityItem[] = [
    ...completions.map((c: { id: string; completedAt: Date; lesson: { title: string } }) => ({
      id: `lesson-${c.id}`,
      description: `Completed lesson: ${c.lesson.title}`,
      timestamp: c.completedAt.toISOString(),
    })),
    ...quizzes.map((q: { id: string; takenAt: Date; quiz: { title: string } }) => ({
      id: `quiz-${q.id}`,
      description: `Took quiz: ${q.quiz.title}`,
      timestamp: q.takenAt.toISOString(),
    })),
    ...submissions.map((s: { id: string; submittedAt: Date; assignment: { title: string } }) => ({
      id: `assignment-${s.id}`,
      description: `Submitted assignment: ${s.assignment.title}`,
      timestamp: s.submittedAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
    .map((a) => ({
      ...a,
      timestamp: new Date(a.timestamp).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }));

  return {
    profile: {
      studentId: user?.registrationNumber ?? "—",
      program: "Student",
      batch: user?.batch ? `${user.batch.startYear} – ${user.batch.endYear}` : "—",
    },
    stats: {
      attendancePercent: attendanceSummary.percentage,
      overallProgressPercent: overallProgress.percentage,
      pendingAssignmentsCount: Math.max(assignmentsSummary.total - assignmentsSummary.completed, 0),
      upcomingExamsCount: activeExams.length,
    },
    courseProgress: subjectProgress,
    performance: performanceTrend.map((p) => ({ label: p.label, score: p.percentage })),
    upcomingClasses,
    upcomingExams,
    pendingAssignments,
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      timestamp: new Date(n.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    })),
    recentActivities,
  };
}
