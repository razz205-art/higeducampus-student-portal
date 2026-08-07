import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { Role } from "@prisma/client";
import Header from "@/components/layout/Header";
import { routes } from "@/config/site";

/**
 * Shell layout for every role-protected area (/student, /faculty,
 * /academic-admin, /super-admin). middleware.ts already blocks
 * unauthenticated/unauthorized requests at the edge; this re-checks the
 * session server-side as defense in depth, and renders the shared header.
 *
 * Dashboard page content for each role is intentionally NOT included yet —
 * only the protected shell and access control are wired up at this stage.
 */
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect(routes.login);
  }

  return (
    <div className="min-h-screen bg-parchment-50">
      <Header userEmail={session.user.email ?? ""} role={session.user.role as Role} />
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
