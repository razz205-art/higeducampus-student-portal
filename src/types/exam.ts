export interface ExamItem {
  id: string;
  title: string;
  description: string | null;
  examDate: string; // ISO timestamp
  isActive: boolean;
}
