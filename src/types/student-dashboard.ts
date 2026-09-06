export interface StudentProfile {
  studentId: string;
  program: string;
  batch: string;
}

export interface StudentStats {
  attendancePercent: number;
  overallProgressPercent: number;
  pendingAssignmentsCount: number;
  upcomingExamsCount: number;
}

export interface CourseProgressItem {
  id: string;
  courseCode: string;
  courseName: string;
  progressPercent: number;
}

export interface PerformancePoint {
  label: string;
  score: number;
}

export interface ScheduleItem {
  id: string;
  courseName: string;
  instructor: string;
  topic: string | null;
  day: string;
  date: string;
  time: string;
  location: string;
  meetingLink: string | null;
}

export interface ExamItem {
  id: string;
  courseName: string;
  examType: string;
  date: string;
  time: string;
}

export type AssignmentStatus = "due-soon" | "overdue" | "upcoming";

export interface AssignmentItem {
  id: string;
  title: string;
  courseName: string;
  dueDate: string;
  status: AssignmentStatus;
}

export interface NotificationItem {
  id: string;
  title: string;
  timestamp: string;
}

export interface ActivityItem {
  id: string;
  description: string;
  timestamp: string;
}

export interface StudentDashboardData {
  profile: StudentProfile;
  stats: StudentStats;
  courseProgress: CourseProgressItem[];
  performance: PerformancePoint[];
  upcomingClasses: ScheduleItem[];
  upcomingExams: ExamItem[];
  pendingAssignments: AssignmentItem[];
  notifications: NotificationItem[];
  recentActivities: ActivityItem[];
}
