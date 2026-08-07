import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { Role } from "@prisma/client";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { routes } from "@/config/site";

/**
 * Shell layout for every role-protected area (/student, /faculty,
 * /academic-admin, /super-admin). middleware.ts already blocks
 * unauthenticated/unauthorized requests at the edge; this re-checks the
 * session server-side as defense in depth, and renders the shared
 * dashboard shell (sidebar, top nav, breadcrumb, notifications, profile
 * menu, mobile drawer, footer).
 *
 * Dashboard page CONTENT for each role is intentionally NOT included yet —
 * only the reusable shell and access control are wired up at this stage.
 */
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect(routes.login);
  }

  return (
    <DashboardShell
      role={session.user.role as Role}
      userName={session.user.name}
      userEmail={session.user.email}
      userImage={session.user.image}
    >
      {children}
    </DashboardShell>
  );
}
