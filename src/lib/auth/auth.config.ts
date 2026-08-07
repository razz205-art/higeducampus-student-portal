import type { NextAuthConfig } from "next-auth";
import { authConfigConstants, routes } from "@/config/site";

/**
 * This split exists because Next.js Middleware runs on the Edge runtime,
 * which cannot use Prisma or bcrypt (both need Node APIs). Middleware only
 * needs to read the JWT to make redirect decisions, so it imports this
 * lightweight config instead of the full auth.ts (which registers providers).
 */
export default {
  pages: {
    signIn: routes.login,
    error: routes.login,
  },
  session: {
    strategy: "jwt",
    maxAge: authConfigConstants.sessionMaxAgeSeconds,
    updateAge: authConfigConstants.sessionUpdateAgeSeconds,
  },
  providers: [], // populated in lib/auth/auth.ts
  callbacks: {
    authorized({ auth }) {
      // Used by middleware's `auth` wrapper to decide if a request may proceed.
      // Fine-grained role checks happen in middleware.ts using lib/rbac/permissions.ts.
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
