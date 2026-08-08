export interface CompletedCourseItem {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  progressPercent: number;
  hasCertificate: boolean;
  certificateId: string | null;
}

export interface CertificateItem {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  studentName: string;
  courseCode: string;
  courseName: string;
  issuedAt: string;
}

export interface CertificateVerification {
  valid: boolean;
  certificateNumber?: string;
  studentName?: string;
  courseCode?: string;
  courseName?: string;
  issuedAt?: string;
}
