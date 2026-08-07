import type { StudentDashboardData } from "@/types/student-dashboard";

/**
 * MOCK DATA — no Course, Attendance, Assignment, Exam, or Notification
 * modules exist in the schema yet (see prisma/schema.prisma). This function
 * is the single seam between the UI and real data: once those modules
 * ship, replace the body with Prisma queries scoped to `userId` and every
 * card on the dashboard keeps working unchanged, since they only consume
 * the `StudentDashboardData` shape below.
 */
export async function getStudentDashboardData(_userId: string): Promise<StudentDashboardData> {
  return {
    profile: {
      studentId: "STU-2026-0148",
      program: "B.Sc. Computer Science",
      batch: "2024 – 2028",
    },
    stats: {
      attendancePercent: 92,
      overallProgressPercent: 68,
      pendingAssignmentsCount: 3,
      upcomingExamsCount: 2,
    },
    courseProgress: [
      {
        id: "c1",
        courseCode: "CS301",
        courseName: "Data Structures & Algorithms",
        progressPercent: 78,
      },
      { id: "c2", courseCode: "CS315", courseName: "Database Systems", progressPercent: 64 },
      { id: "c3", courseCode: "CS322", courseName: "Operating Systems", progressPercent: 55 },
      { id: "c4", courseCode: "MA210", courseName: "Discrete Mathematics", progressPercent: 81 },
    ],
    performance: [
      { label: "Quiz 1", score: 74 },
      { label: "Quiz 2", score: 81 },
      { label: "Midterm", score: 77 },
      { label: "Quiz 3", score: 85 },
      { label: "Quiz 4", score: 88 },
      { label: "Project", score: 91 },
    ],
    upcomingClasses: [
      {
        id: "cls1",
        courseName: "Data Structures & Algorithms",
        instructor: "Dr. Adeyemi Okafor",
        day: "Monday",
        time: "9:00 AM – 10:30 AM",
        location: "Room 204, Engineering Block",
      },
      {
        id: "cls2",
        courseName: "Database Systems",
        instructor: "Prof. Lena Marsh",
        day: "Monday",
        time: "11:00 AM – 12:30 PM",
        location: "Room 118, CS Building",
      },
      {
        id: "cls3",
        courseName: "Operating Systems",
        instructor: "Dr. Raj Patel",
        day: "Tuesday",
        time: "2:00 PM – 3:30 PM",
        location: "Lab 3, CS Building",
      },
    ],
    upcomingExams: [
      {
        id: "ex1",
        courseName: "Database Systems",
        examType: "Midterm Exam",
        date: "Aug 18, 2026",
        time: "10:00 AM",
      },
      {
        id: "ex2",
        courseName: "Discrete Mathematics",
        examType: "Final Exam",
        date: "Aug 27, 2026",
        time: "1:00 PM",
      },
    ],
    pendingAssignments: [
      {
        id: "a1",
        title: "B-Tree Implementation",
        courseName: "Data Structures & Algorithms",
        dueDate: "Aug 10, 2026",
        status: "due-soon",
      },
      {
        id: "a2",
        title: "Normalization Case Study",
        courseName: "Database Systems",
        dueDate: "Aug 9, 2026",
        status: "overdue",
      },
      {
        id: "a3",
        title: "Process Scheduling Report",
        courseName: "Operating Systems",
        dueDate: "Aug 15, 2026",
        status: "upcoming",
      },
    ],
    notifications: [
      {
        id: "n1",
        title: "Grade posted for Quiz 4 — Data Structures & Algorithms",
        timestamp: "2 hours ago",
      },
      { id: "n2", title: "Room change: Database Systems now in Room 118", timestamp: "Yesterday" },
      { id: "n3", title: "Library books due for renewal", timestamp: "2 days ago" },
    ],
    recentActivities: [
      {
        id: "act1",
        description: "Submitted \u201cSorting Algorithms Lab\u201d",
        timestamp: "Today, 9:12 AM",
      },
      {
        id: "act2",
        description: "Viewed feedback on Midterm — Database Systems",
        timestamp: "Yesterday, 4:40 PM",
      },
      {
        id: "act3",
        description: "Joined study group for Operating Systems",
        timestamp: "2 days ago",
      },
      {
        id: "act4",
        description: "Downloaded lecture notes — Discrete Mathematics",
        timestamp: "3 days ago",
      },
    ],
  };
}
