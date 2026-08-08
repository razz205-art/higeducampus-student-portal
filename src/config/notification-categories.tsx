import {
  Megaphone,
  GraduationCap,
  CalendarClock,
  ClipboardList,
  Wallet,
  PartyPopper,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import type { NotificationCategory } from "@/types/notification";

export const CATEGORY_CONFIG: Record<
  NotificationCategory,
  { label: string; icon: LucideIcon; variant: "info" | "warning" | "danger" | "success" }
> = {
  ANNOUNCEMENT: { label: "Announcement", icon: Megaphone, variant: "info" },
  EXAM_UPDATE: { label: "Exam Update", icon: GraduationCap, variant: "warning" },
  SCHEDULE_CHANGE: { label: "Schedule Change", icon: CalendarClock, variant: "warning" },
  ASSIGNMENT_REMINDER: { label: "Assignment Reminder", icon: ClipboardList, variant: "info" },
  FEE_REMINDER: { label: "Fee Reminder", icon: Wallet, variant: "danger" },
  HOLIDAY_NOTICE: { label: "Holiday Notice", icon: PartyPopper, variant: "success" },
  PLACEMENT_UPDATE: { label: "Placement Update", icon: Briefcase, variant: "success" },
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_CONFIG).map(([value, cfg]) => ({
  value: value as NotificationCategory,
  label: cfg.label,
}));
