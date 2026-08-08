export type NotificationCategory =
  | "ANNOUNCEMENT"
  | "EXAM_UPDATE"
  | "SCHEDULE_CHANGE"
  | "ASSIGNMENT_REMINDER"
  | "FEE_REMINDER"
  | "HOLIDAY_NOTICE"
  | "PLACEMENT_UPDATE";

export type AttachmentType = "IMAGE" | "PDF" | "VIDEO";

export interface NotificationAttachmentItem {
  id: string;
  type: AttachmentType;
  url: string;
  label: string | null;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  isPinned: boolean;
  createdAt: string;
  createdByName: string;
  attachments: NotificationAttachmentItem[];
  isRead: boolean;
}

export interface NotificationSummary {
  id: string;
  title: string;
  category: NotificationCategory;
  createdAt: string;
  isRead: boolean;
}

export type NotificationFilter = "all" | "unread" | "pinned";
