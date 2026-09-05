export type TestReportEntryStatus = "PASS" | "NEEDS_IMPROVEMENT";

export interface TestReportEntryRow {
  id: string;
  rank: number;
  name: string;
  percentage: number;
  correct: number | null;
  incorrect: number | null;
  timeRaw: string | null;
  status: TestReportEntryStatus;
  studentId: string | null;
  studentName: string | null;
}

/** One row per past test report, shown in the admin's "Test Reports" list. */
export interface TestReportSummary {
  id: string;
  title: string;
  createdAt: string; // ISO date
  passingPercentage: number;
  courseId: string;
  courseCode: string;
  courseName: string;
  batchId: string;
  batchName: string;
  totalStudents: number;
  averagePercentage: number;
  passRate: number; // 0-100
}

export interface ScoreDistributionBucket {
  label: string; // e.g. "90-100%"
  count: number;
}

/** Full dashboard view for one test report — stats, top performers, distribution, full table. */
export interface TestReportDetail {
  id: string;
  title: string;
  createdAt: string;
  passingPercentage: number;
  courseId: string;
  courseCode: string;
  courseName: string;
  batchId: string;
  batchName: string;
  totalStudents: number;
  averagePercentage: number;
  passRate: number;
  highestPercentage: number;
  entries: TestReportEntryRow[];
  topPerformers: TestReportEntryRow[];
  scoreDistribution: ScoreDistributionBucket[];
}

/** A single student's own result within one test report — no other students' data included. */
export interface StudentTestReportRow {
  testReportId: string;
  title: string;
  createdAt: string;
  rank: number;
  totalStudents: number;
  percentage: number;
  correct: number | null;
  incorrect: number | null;
  timeRaw: string | null;
  status: TestReportEntryStatus;
}
