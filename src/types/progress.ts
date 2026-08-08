import type { CourseOption } from "@/types/attendance";
export type { CourseOption };

export interface OverallProgress {
  totalLessons: number;
  completedLessons: number;
  percentage: number;
}

export interface ModuleProgressItem {
  id: string;
  title: string;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  lessons: LessonItem[];
}

export interface LessonItem {
  id: string;
  title: string;
  order: number;
  completed: boolean;
}

export interface ClassesSummary {
  completed: number;
  remaining: number;
  total: number;
}

export interface QuizPerformanceRow {
  id: string;
  quizTitle: string;
  courseCode: string;
  courseName: string;
  score: number;
  maxScore: number;
  percentage: number;
  takenAt: string;
}

export interface AssignmentsSummary {
  completed: number;
  total: number;
  percentage: number;
}

export interface LearningStreak {
  current: number;
  longest: number;
  activeToday: boolean;
}

export interface ActivityPoint {
  label: string;
  count: number;
}

export type BadgeIconKey =
  "flame" | "trophy" | "target" | "book" | "star" | "medal" | "zap" | "crown";

export interface Badge {
  id: string;
  label: string;
  description: string;
  icon: BadgeIconKey;
  earned: boolean;
}
