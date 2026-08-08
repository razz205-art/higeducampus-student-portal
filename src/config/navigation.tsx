import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  CalendarDays,
  CalendarCheck2,
  MessagesSquare,
  Building2,
  Library,
  Users,
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

  switch (role) {
    case "STUDENT":
      return [
        { items: [overview] },
        {
          title: "Academics",
          items: [
            { label: "Attendance", href: "/student/attendance", icon: CalendarCheck2 },
            { label: "Progress", href: "/student/progress", icon: TrendingUp },
            { label: "My Courses", icon: BookOpen, comingSoon: true },
            { label: "Assignments", icon: ClipboardCheck, comingSoon: true },
          ],
        },
        {
          title: "Campus",
          items: [
            { label: "Calendar", icon: CalendarDays, comingSoon: true },
            { label: "Messages", icon: MessagesSquare, comingSoon: true },
          ],
        },
      ];

    case "FACULTY":
      return [
        { items: [overview] },
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
            { label: "Calendar", icon: CalendarDays, comingSoon: true },
            { label: "Messages", icon: MessagesSquare, comingSoon: true },
          ],
        },
      ];

    case "ACADEMIC_ADMIN":
      return [
        { items: [overview] },
        {
          title: "Administration",
          items: [
            { label: "Attendance", href: "/academic-admin/attendance", icon: CalendarCheck2 },
            { label: "Departments", icon: Building2, comingSoon: true },
            { label: "Course Catalog", icon: Library, comingSoon: true },
            { label: "Faculty", icon: Users, comingSoon: true },
          ],
        },
        {
          title: "Insights",
          items: [{ label: "Reports", icon: FileClock, comingSoon: true }],
        },
      ];

    case "SUPER_ADMIN":
      return [
        { items: [overview] },
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
      return [{ items: [overview] }];
  }
}
