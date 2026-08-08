import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  Timer,
  CalendarDays,
  CalendarCheck2,
  Bell,
  Award,
  BadgeCheck,
  Library,
  MessagesSquare,
  Users,
  GraduationCap,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  FileClock,
  SlidersHorizontal,
} from "lucide-react";
import { Role } from "@prisma/client";
import { ROLE_HOME } from "@/lib/rbac/permissions";

export interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  /** Module not built yet — rendered as a disabled row with a "Soon" pill. */
  comingSoon?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

/**
 * Single source of truth for sidebar/drawer navigation. Only the "Overview"
 * item in each role's list is a real, working link (to that role's
 * dashboard home). Everything else previews the structure of upcoming
 * modules without claiming they exist yet — remove `comingSoon` and add a
 * real `href` as each module ships.
 */
export function getNavSections(role: Role): NavSection[] {
  const overview: NavItem = {
    label: "Overview",
    href: ROLE_HOME[role],
    icon: LayoutDashboard,
  };
  const notifications: NavItem = {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
  };

  switch (role) {
    case "STUDENT":
      return [
        { items: [overview, notifications] },
        {
          title: "Academics",
          items: [
            { label: "Attendance", href: "/student/attendance", icon: CalendarCheck2 },
            { label: "Progress", href: "/student/progress", icon: TrendingUp },
            { label: "Results", href: "/student/results", icon: Award },
            { label: "Certificates", href: "/student/certificates", icon: BadgeCheck },
            { label: "Exam Countdown", href: "/student/exams", icon: Timer },
            { label: "Study Materials", href: "/student/materials", icon: Library },
            { label: "Assignments", icon: ClipboardCheck, comingSoon: true },
          ],
        },
        {
          title: "Campus",
          items: [
            { label: "Timetable", href: "/student/timetable", icon: CalendarDays },
            { label: "Messages", icon: MessagesSquare, comingSoon: true },
          ],
        },
      ];

    case "FACULTY":
      return [
        { items: [overview, notifications] },
        {
          title: "Teaching",
          items: [
            { label: "My Courses", icon: BookOpen, comingSoon: true },
            { label: "Gradebook", icon: ClipboardCheck, comingSoon: true },
            { label: "Attendance", href: "/faculty/attendance", icon: CalendarCheck2 },
          ],
        },
        {
          title: "Campus",
          items: [
            { label: "Timetable", href: "/faculty/timetable", icon: CalendarDays },
            { label: "Messages", icon: MessagesSquare, comingSoon: true },
          ],
        },
      ];

    case "ACADEMIC_ADMIN":
      return [
        { items: [overview, notifications] },
        {
          title: "People",
          items: [
            { label: "Students", href: "/academic-admin/students", icon: Users },
            { label: "Faculty", href: "/academic-admin/faculty", icon: GraduationCap },
          ],
        },
        {
          title: "Academics",
          items: [
            { label: "Courses", href: "/academic-admin/courses", icon: BookOpen },
            { label: "Attendance", href: "/academic-admin/attendance", icon: CalendarCheck2 },
            { label: "Assignments", href: "/academic-admin/assignments", icon: ClipboardList },
            { label: "Timetable", href: "/academic-admin/timetable", icon: CalendarDays },
            { label: "Results", href: "/academic-admin/results", icon: BarChart3 },
            { label: "Study Materials", href: "/academic-admin/materials", icon: Library },
            { label: "Certificates", href: "/academic-admin/certificates", icon: Award },
            { label: "Exam Countdown", href: "/academic-admin/exams", icon: Timer },
          ],
        },
        {
          title: "Insights",
          items: [{ label: "Analytics", href: "/academic-admin/analytics", icon: BarChart3 }],
        },
      ];

    case "SUPER_ADMIN":
      return [
        { items: [overview, notifications] },
        {
          title: "Platform",
          items: [
            { label: "User Management", icon: Users, comingSoon: true },
            { label: "Roles & Permissions", icon: ShieldCheck, comingSoon: true },
          ],
        },
        {
          title: "System",
          items: [
            { label: "Audit Logs", icon: FileClock, comingSoon: true },
            { label: "Settings", icon: SlidersHorizontal, comingSoon: true },
          ],
        },
      ];

    default:
      return [{ items: [overview, notifications] }];
  }
}
