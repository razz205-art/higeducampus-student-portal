export type TestReportEntryStatus = "PASS" | "NEEDS_IMPROVEMENT";

export type TestReportType = "DAILY" | "WEEKLY" | "MODULE" | "MOCK";

export const TEST_REPORT_TYPES: { value: TestReportType; label: string }[] = [
  { value: "DAILY", label: "Daily Test" },
  { value: "WEEKLY", label: "Weekly Test" },
  { value: "MODULE", label: "Module Test" },
  { value: "MOCK", label: "Mock Test" },
];

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
  testType: TestReportType;
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
  testType: TestReportType;
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
  testType: TestReportType;
  createdAt: string;
  rank: number;
  totalStudents: number;
  percentage: number;
  correct: number | null;
  incorrect: number | null;
  timeRaw: string | null;
  status: TestReportEntryStatus;
}

/** One point in a per-test-type score trend, used by the progress-by-type view. */
export interface TestTypeTrendPoint {
  label: string; // the test's title
  date: string; // ISO date
  percentage: number;
}

/** A student's progress within a single test type (Daily/Weekly/Module/Mock). */
export interface TestTypeProgress {
  testType: TestReportType;
  label: string; // "Daily Test", etc.
  testsTaken: number;
  averagePercentage: number;
  latestPercentage: number | null;
  passRate: number; // 0-100, of the student's own attempts in this type
  trend: TestTypeTrendPoint[];
}
