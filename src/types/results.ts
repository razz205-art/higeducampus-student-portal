export type ResultStatus = "PASS" | "FAIL" | "PENDING";

export interface SemesterCourseResultRow {
  id: string;
  courseCode: string;
  courseName: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
}

export interface SemesterResultItem {
  id: string;
  semesterLabel: string;
  gpa: number;
  percentage: number;
  status: ResultStatus;
  publishedAt: string;
  courseResults: SemesterCourseResultRow[];
}

export interface BatchRankInfo {
  rank: number;
  totalStudents: number;
  percentile: number;
  batchName: string;
}

export interface ResultsPerformancePoint {
  label: string;
  date: string;
  percentage: number;
}

export interface AssignmentResultRow {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  status: "SUBMITTED" | "GRADED";
  score: number | null;
  maxScore: number;
  submittedAt: string;
}
