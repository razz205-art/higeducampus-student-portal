import { Role } from "@prisma/client";

/**
 * Single source of truth for role -> route mapping and cross-role access.
 * Keep middleware.ts and any server-side guards pointed at this file so
 * permissions never drift out of sync.
 */

export const ROLES = [
  "STUDENT",
  "FACULTY",
  "ACADEMIC_ADMIN",
  "SUPER_ADMIN",
] as const satisfies readonly Role[];

export const ROLE_HOME: Record<Role, string> = {
  STUDENT: "/student",
  FACULTY: "/faculty",
  ACADEMIC_ADMIN: "/academic-admin",
  SUPER_ADMIN: "/super-admin",
};

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Student",
  FACULTY: "Faculty",
  ACADEMIC_ADMIN: "Academic Admin",
  SUPER_ADMIN: "Super Admin",
};

/**
 * Maps a protected route prefix to the roles allowed to access it.
 * SUPER_ADMIN is intentionally granted access to every area below, since
 * that role administers the whole platform. Extend this list as new
 * protected areas (courses, grading, reports, etc.) are added.
 */
export const ROUTE_PERMISSIONS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/student", roles: ["STUDENT", "SUPER_ADMIN"] },
  { prefix: "/faculty", roles: ["FACULTY", "SUPER_ADMIN"] },
  { prefix: "/academic-admin", roles: ["ACADEMIC_ADMIN", "SUPER_ADMIN"] },
  { prefix: "/super-admin", roles: ["SUPER_ADMIN"] },
];

export function getRequiredRolesForPath(pathname: string): Role[] | null {
  const match = ROUTE_PERMISSIONS.find((r) => pathname.startsWith(r.prefix));
  return match ? match.roles : null;
}

export function isRoleAllowed(role: Role | undefined, pathname: string): boolean {
  const required = getRequiredRolesForPath(pathname);
  if (!required) return true; // not a role-guarded route
  if (!role) return false;
  return required.includes(role);
}
