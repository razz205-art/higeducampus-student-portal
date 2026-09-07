export type ClassStatus = "ongoing" | "upcoming" | "completed" | "scheduled";

export type SessionCompletionKind = "LIVE" | "RECORDING" | "TEST";

export interface TimetableSlotItem {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  facultyName: string;
  batchId: string | null;
  batchName: string | null;
  topic: string | null;
  specificDate: string | null; // ISO date (YYYY-MM-DD) — if set, a one-time class on this date only
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  location: string | null;
  meetingLink: string | null;
  recordingUrl: string | null; // pre-class prep video, watched before the live session
  isActive: boolean;
  isExam: boolean; // flags this as an exam session, shown in "Upcoming Exams" instead of "Upcoming Classes"
}

/** A slot projected onto one real calendar date, with a computed status. */
export interface ProjectedClass extends TimetableSlotItem {
  date: string; // ISO date (YYYY-MM-DD)
  status: ClassStatus;
}

/**
 * A ProjectedClass enriched with this student's own completion state for
 * this specific occurrence — whether they joined the live session, watched
 * the prep recording, or self-marked test attendance. Only ever built for
 * the requesting student's own view, never anyone else's.
 */
export interface StudentProjectedClass extends ProjectedClass {
  liveAttended: boolean;
  recordingWatched: boolean;
  testAttended: boolean;
}

export interface CalendarDay {
  date: string;
  dayOfWeek: number;
  classCount: number;
}

/** Per-course breakdown of recorded-session watch completion. */
export interface RecordingCourseStats {
  courseId: string;
  courseCode: string;
  courseName: string;
  total: number;
  watched: number;
}

/**
 * A student's overall progress watching recorded (prep) sessions across
 * their enrolled courses — separate from live-class or test attendance,
 * since watching a recording is self-paced completion, not a scheduled
 * event. "Total" counts each distinct class slot that has a recording
 * attached and has already become available (its class time has started
 * or passed, or it's a recurring class); "watched" counts how many of
 * those the student has marked as watched at least once.
 */
export interface RecordingStats {
  totalRecordings: number;
  watchedRecordings: number;
  percentage: number;
  perCourse: RecordingCourseStats[];
}
