export type ClassStatus = "ongoing" | "upcoming" | "completed" | "scheduled";

export interface TimetableSlotItem {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  facultyName: string;
  batchId: string | null;
  batchName: string | null;
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  location: string | null;
  meetingLink: string | null;
  isActive: boolean;
}

/** A slot projected onto one real calendar date, with a computed status. */
export interface ProjectedClass extends TimetableSlotItem {
  date: string; // ISO date (YYYY-MM-DD)
  status: ClassStatus;
}

export interface CalendarDay {
  date: string;
  dayOfWeek: number;
  classCount: number;
}
