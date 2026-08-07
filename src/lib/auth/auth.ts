import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/security/password";
import { loginSchema } from "@/lib/validations/auth";
import { authConfigConstants } from "@/config/site";
import authConfig from "@/lib/auth/auth.config";

const { maxFailedLoginAttempts, accountLockDurationMs } = authConfigConstants;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });

        // Uniform failure path: don't reveal whether the email exists.
        if (!user || !user.passwordHash) {
          return null;
        }

        if (!user.isActive) {
          throw new Error("ACCOUNT_DISABLED");
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("ACCOUNT_LOCKED");
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
          const failedCount = user.failedLoginCount + 1;
          const shouldLock = failedCount >= maxFailedLoginAttempts;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: shouldLock ? 0 : failedCount,
              lockedUntil: shouldLock
                ? new Date(Date.now() + accountLockDurationMs)
                : user.lockedUntil,
            },
          });

          await prisma.auditLog.create({
            data: {
              userId: user.id,
              event: shouldLock ? "ACCOUNT_LOCKED" : "LOGIN_FAILED",
            },
          });

          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginCount: 0, lockedUntil: null },
        });
        await prisma.auditLog.create({
          data: { userId: user.id, event: "LOGIN_SUCCESS" },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // Google sign-in: block disabled accounts. Never let OAuth silently
      // escalate a role — role changes must go through admin tooling.
      if (account?.provider === "google") {
        const existing = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (existing && !existing.isActive) return false;
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role;
      }

      // Keep role fresh: if an admin changes a user's role mid-session,
      // pick it up on the next token refresh instead of waiting out the
      // full session lifetime.
      if (trigger === "update" || !("role" in token)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, isActive: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          if (!dbUser.isActive) token.disabled = true;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await prisma.auditLog.create({
          data: { userId: user.id, event: "LOGIN_SUCCESS_GOOGLE" },
        });
      }
    },
  },
});
