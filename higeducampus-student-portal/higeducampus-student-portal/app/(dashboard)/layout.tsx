import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import RoleBadge from "@/components/dashboard/RoleBadge";
import SignOutButton from "@/components/dashboard/SignOutButton";

/**
 * Defense in depth: middleware.ts already blocks unauthenticated/unauthorized
 * requests at the edge, but every layout re-checks the session server-side.
 * This protects against any future misconfiguration of the middleware
 * matcher and ensures data fetched in child pages never runs for a session
 * that has since been revoked.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-parchment-50">
      <header className="border-b border-ink-900/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="font-serif text-lg font-semibold text-ink-900">HigEduCampus</span>
            <RoleBadge role={session.user.role as Role} />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink-900/60">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
