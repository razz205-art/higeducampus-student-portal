import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/lib/auth/auth.config";
import { getRequiredRolesForPath, ROLE_HOME } from "@/lib/rbac/permissions";
import { routes } from "@/config/site";

const { auth } = NextAuth(authConfig);

const PUBLIC_AUTH_ROUTES: string[] = [
  routes.login,
  routes.register,
  routes.forgotPassword,
  routes.resetPassword,
];

const PROTECTED_PREFIXES = [
  "/student",
  "/faculty",
  "/academic-admin",
  "/super-admin",
  "/attendance",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role as
    "STUDENT" | "FACULTY" | "ACADEMIC_ADMIN" | "SUPER_ADMIN" | undefined;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isPublicAuthPage = PUBLIC_AUTH_ROUTES.includes(pathname);

  // Not logged in and hitting a protected route -> send to login, preserving destination.
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL(routes.login, req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in but role doesn't match the route -> block, don't leak other roles' pages.
  if (isProtected && isLoggedIn) {
    const requiredRoles = getRequiredRolesForPath(pathname);
    if (requiredRoles && role && !requiredRoles.includes(role)) {
      return NextResponse.redirect(new URL(routes.unauthorized, req.nextUrl.origin));
    }
  }

  // Already logged in and visiting an auth page -> bounce to their dashboard.
  if (isPublicAuthPage && isLoggedIn && role) {
    return NextResponse.redirect(new URL(ROLE_HOME[role], req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Run on every route except static assets and Next.js internals.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.\\w+$).*)"],
};
