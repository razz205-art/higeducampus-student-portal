import { prisma } from "@/lib/db/prisma";
import { getStudentCourses, getStudentAttendanceSummary } from "@/lib/data/attendance";
import {
  todayUTC,
  toDateOnlyUTC,
  formatISODate,
  formatMonthLabel,
  addMonthsUTC,
  daysInMonth,
} from "@/lib/utils/date";
import type {
  OverallProgress,
  ModuleProgressItem,
  ClassesSummary,
  QuizPerformanceRow,
  AssignmentsSummary,
  LearningStreak,
  ActivityPoint,
  Badge,
} from "@/types/progress";
import type { CourseProgressItem } from "@/types/student-dashboard";

// ---------------------------------------------------------------------------
// Overall / subject / module progress
// ---------------------------------------------------------------------------

export async function getOverallProgress(studentId: string): Promise<OverallProgress> {
  const courses = await getStudentCourses(studentId);
  const courseIds = courses.map((c) => c.id);
  if (courseIds.length === 0) return { totalLessons: 0, completedLessons: 0, percentage: 0 };

  const [totalLessons, completedLessons] = await Promise.all([
    prisma.lesson.count({ where: { module: { courseId: { in: courseIds } } } }),
    prisma.lessonCompletion.count({
      where: { studentId, lesson: { module: { courseId: { in: courseIds } } } },
    }),
  ]);

  return {
    totalLessons,
    completedLessons,
    percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 1000) / 10 : 0,
  };
}

/** Per-course ("subject") progress — shaped to reuse the existing CourseProgressCard component. */
export async function getSubjectProgress(studentId: string): Promise<CourseProgressItem[]> {
  const courses = await getStudentCourses(studentId);

  return Promise.all(
    courses.map(async (course) => {
      const [total, completed] = await Promise.all([
        prisma.lesson.count({ where: { module: { courseId: course.id } } }),
        prisma.lessonCompletion.count({
          where: { studentId, lesson: { module: { courseId: course.id } } },
        }),
      ]);
      return {
        id: course.id,
        courseCode: course.code,
        courseName: course.name,
        progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    })
  );
}

export async function getModuleProgress(
  studentId: string,
  courseId: string
): Promise<ModuleProgressItem[]> {
  const modules = await prisma.module.findMany({
    where: { courseId },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: { completions: { where: { studentId }, select: { id: true } } },
      },
    },
    orderBy: { order: "asc" },
  });

  return modules.map(
    (m: {
      id: string;
      title: string;
      lessons: { id: string; title: string; order: number; completions: { id: string }[] }[];
    }) => {
      const lessons = m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        order: l.order,
        completed: l.completions.length > 0,
      }));
      const completedLessons = lessons.filter((l) => l.completed).length;
      return {
        id: m.id,
        title: m.title,
        totalLessons: lessons.length,
        completedLessons,
        percentage: lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0,
        lessons,
      };
    }
  );
}

export async function getClassesSummary(studentId: string): Promise<ClassesSummary> {
  const { totalLessons, completedLessons } = await getOverallProgress(studentId);
  return {
    completed: completedLessons,
    remaining: totalLessons - completedLessons,
    total: totalLessons,
  };
}

/** Verifies the lesson belongs to a course the student is enrolled in. */
export async function assertStudentCanToggleLesson(
  studentId: string,
  lessonId: string
): Promise<{ courseId: string }> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson) throw new Error("Lesson not found.");

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId: lesson.module.courseId } },
  });
  if (!enrollment) throw new Error("You are not enrolled in this course.");

  return { courseId: lesson.module.courseId };
}

// ---------------------------------------------------------------------------
// Quizzes & assignments
// ---------------------------------------------------------------------------

export async function getQuizPerformance(
  studentId: string,
  limit = 10
): Promise<QuizPerformanceRow[]> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { studentId },
    include: { quiz: { include: { course: { select: { code: true, name: true } } } } },
    orderBy: { takenAt: "desc" },
    take: limit,
  });

  return attempts.map(
    (a: {
      id: string;
      score: number;
      takenAt: Date;
      quiz: { title: string; maxScore: number; course: { code: string; name: string } };
    }) => ({
      id: a.id,
      quizTitle: a.quiz.title,
      courseCode: a.quiz.course.code,
      courseName: a.quiz.course.name,
      score: a.score,
      maxScore: a.quiz.maxScore,
      percentage: a.quiz.maxScore > 0 ? Math.round((a.score / a.quiz.maxScore) * 100) : 0,
      takenAt: formatISODate(a.takenAt),
    })
  );
}

export async function getAssignmentsSummary(studentId: string): Promise<AssignmentsSummary> {
  const courses = await getStudentCourses(studentId);
  const courseIds = courses.map((c) => c.id);
  if (courseIds.length === 0) return { completed: 0, total: 0, percentage: 0 };

  const [total, completed] = await Promise.all([
    prisma.assignment.count({ where: { courseId: { in: courseIds } } }),
    prisma.assignmentSubmission.count({
      where: { studentId, assignment: { courseId: { in: courseIds } } },
    }),
  ]);

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

// ---------------------------------------------------------------------------
// Streak & activity graphs
// ---------------------------------------------------------------------------

async function getActivityDates(studentId: string): Promise<Date[]> {
  const [lessons, quizzes, assignments] = await Promise.all([
    prisma.lessonCompletion.findMany({ where: { studentId }, select: { completedAt: true } }),
    prisma.quizAttempt.findMany({ where: { studentId }, select: { takenAt: true } }),
    prisma.assignmentSubmission.findMany({ where: { studentId }, select: { submittedAt: true } }),
  ]);
  return [
    ...lessons.map((l: { completedAt: Date }) => l.completedAt),
    ...quizzes.map((q: { takenAt: Date }) => q.takenAt),
    ...assignments.map((a: { submittedAt: Date }) => a.submittedAt),
  ];
}

export async function getLearningStreak(studentId: string): Promise<LearningStreak> {
  const dates = await getActivityDates(studentId);
  const dayKeys = new Set(
    dates.map((d) =>
      formatISODate(toDateOnlyUTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    )
  );

  if (dayKeys.size === 0) return { current: 0, longest: 0, activeToday: false };

  const today = todayUTC();
  const todayKey = formatISODate(today);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = formatISODate(yesterday);

  const activeToday = dayKeys.has(todayKey);

  // Current streak: walk backward from today (or yesterday, if today has no
  // activity yet but yesterday does — the streak isn't broken until a full
  // day is missed).
  let current = 0;
  if (activeToday || dayKeys.has(yesterdayKey)) {
    const cursor = new Date(activeToday ? today : yesterday);
    while (dayKeys.has(formatISODate(cursor))) {
      current++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
  }

  // Longest streak: scan all known days for the longest consecutive run.
  const sortedKeys = Array.from(dayKeys).sort();
  let longest = 0;
  let run = 0;
  let prevDate: Date | null = null;
  for (const key of sortedKeys) {
    const d = new Date(`${key}T00:00:00.000Z`);
    if (prevDate) {
      const diffDays = Math.round((d.getTime() - prevDate.getTime()) / 86_400_000);
      run = diffDays === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prevDate = d;
  }

  return { current, longest: Math.max(longest, current), activeToday };
}

export async function getWeeklyActivity(studentId: string): Promise<ActivityPoint[]> {
  const dates = await getActivityDates(studentId);
  const counts = new Map<string, number>();
  for (const d of dates) {
    const key = formatISODate(toDateOnlyUTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = todayUTC();
  const points: ActivityPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - i);
    const key = formatISODate(day);
    points.push({ label: WEEKDAY[day.getUTCDay()]!, count: counts.get(key) ?? 0 });
  }
  return points;
}

export async function getMonthlyActivity(studentId: string): Promise<ActivityPoint[]> {
  const dates = await getActivityDates(studentId);
  const now = todayUTC();
  const points: ActivityPoint[] = [];

  for (let i = 5; i >= 0; i--) {
    const monthDate = addMonthsUTC(toDateOnlyUTC(now.getUTCFullYear(), now.getUTCMonth(), 1), -i);
    const year = monthDate.getUTCFullYear();
    const monthIndex = monthDate.getUTCMonth();
    const start = toDateOnlyUTC(year, monthIndex, 1);
    const end = toDateOnlyUTC(year, monthIndex, daysInMonth(year, monthIndex));

    const count = dates.filter((d) => d >= start && d <= end).length;
    points.push({ label: formatMonthLabel(monthDate), count });
  }
  return points;
}

// ---------------------------------------------------------------------------
// Achievements / badges — evaluated dynamically from real stats, including
// attendance data reused from the attendance module (no separate storage
// or admin management UI needed for a fixed badge catalog).
// ---------------------------------------------------------------------------

export async function getAchievements(studentId: string): Promise<Badge[]> {
  const [overall, streak, assignments, attendance, quizAttempts] = await Promise.all([
    getOverallProgress(studentId),
    getLearningStreak(studentId),
    getAssignmentsSummary(studentId),
    getStudentAttendanceSummary(studentId),
    prisma.quizAttempt.findMany({
      where: { studentId },
      include: { quiz: { select: { maxScore: true } } },
    }),
  ]);

  const avgQuizPercentage =
    quizAttempts.length > 0
      ? Math.round(
          (quizAttempts.reduce(
            (sum: number, a: { score: number; quiz: { maxScore: number } }) =>
              sum + (a.quiz.maxScore > 0 ? a.score / a.quiz.maxScore : 0),
            0
          ) /
            quizAttempts.length) *
            100
        )
      : 0;

  return [
    {
      id: "first-steps",
      label: "First Steps",
      description: "Complete your first lesson",
      icon: "book",
      earned: overall.completedLessons >= 1,
    },
    {
      id: "streak-7",
      label: "7-Day Streak",
      description: "Stay active for 7 days in a row",
      icon: "flame",
      earned: streak.longest >= 7,
    },
    {
      id: "streak-30",
      label: "30-Day Streak",
      description: "Stay active for 30 days in a row",
      icon: "crown",
      earned: streak.longest >= 30,
    },
    {
      id: "quiz-ace",
      label: "Quiz Ace",
      description: "Average 90%+ across your quiz attempts",
      icon: "trophy",
      earned: quizAttempts.length > 0 && avgQuizPercentage >= 90,
    },
    {
      id: "halfway",
      label: "Halfway There",
      description: "Reach 50% overall course progress",
      icon: "target",
      earned: overall.percentage >= 50,
    },
    {
      id: "course-complete",
      label: "Course Complete",
      description: "Finish 100% of your enrolled lessons",
      icon: "medal",
      earned: overall.totalLessons > 0 && overall.percentage >= 100,
    },
    {
      id: "assignment-pro",
      label: "Assignment Pro",
      description: "Submit every assignment on time",
      icon: "star",
      earned: assignments.total > 0 && assignments.percentage >= 100,
    },
    {
      id: "perfect-attendance",
      label: "Perfect Attendance",
      description: "Maintain 95%+ attendance",
      icon: "zap",
      earned: attendance.total > 0 && attendance.percentage >= 95,
    },
  ];
}
