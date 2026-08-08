export interface CourseCompletionRow {
  courseId: string;
  courseCode: string;
  courseName: string;
  enrolledCount: number;
  completedCount: number;
  completionPercent: number;
}

export interface AssignmentCompletionRow {
  courseId: string;
  courseCode: string;
  courseName: string;
  totalAssignments: number;
  possibleSubmissions: number;
  actualSubmissions: number;
  completionPercent: number;
}

export interface FacultyPerformanceRow {
  facultyId: string;
  facultyName: string;
  courseCount: number;
  studentCount: number;
  avgAttendancePercent: number;
  avgResultPercent: number;
}
