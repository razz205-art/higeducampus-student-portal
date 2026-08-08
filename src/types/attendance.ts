import type { AttendanceStatus } from "@prisma/client";

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  leave: number;
  percentage: number;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  status: AttendanceStatus | null; // null = no record (weekend, holiday, or not yet marked)
}

export interface AttendanceHistoryRow {
  id: string;
  date: string;
  courseCode: string;
  courseName: string;
  status: AttendanceStatus;
}

export interface AttendanceTrendPoint {
  month: string; // e.g. "Mar 2026"
  percentage: number;
}

export interface CourseOption {
  id: string;
  code: string;
  name: string;
}

export interface RosterEntry {
  studentId: string;
  name: string;
  email: string;
  status: AttendanceStatus | null;
}

export interface AdminCourseAttendanceRow {
  courseId: string;
  code: string;
  name: string;
  facultyName: string;
  enrolledCount: number;
  averagePercentage: number;
}

export interface AdminStudentAttendanceRow {
  studentId: string;
  name: string;
  email: string;
  summary: AttendanceSummary;
}

// ---------------------------------------------------------------------------
// Live class sessions
// ---------------------------------------------------------------------------

export type MeetingPlatform = "ZOOM" | "GOOGLE_MEET";

export interface LiveSessionRow {
  id: string;
  courseCode: string;
  courseName: string;
  subjectLabel: string;
  batchName: string | null;
  facultyName: string;
  date: string;
  startTime: string;
  platform: MeetingPlatform;
  meetingLink: string;
  isActive: boolean;
}

export interface ActiveSessionDetails {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  subjectLabel: string;
  batchId: string | null;
  batchName: string | null;
  facultyName: string;
  date: string;
  startTime: string;
  platform: MeetingPlatform;
}

export interface BatchOption {
  id: string;
  name: string;
}

export type ReportFormat = "csv" | "xlsx" | "pdf";
