import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { ROLE_HOME } from "@/lib/rbac/permissions";
import { routes } from "@/config/site";

export default async function UnauthorizedPage() {
  const session = await auth();
  const role = session?.user?.role as keyof typeof ROLE_HOME | undefined;
  const homeHref = role ? ROLE_HOME[role] : routes.login;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-parchment-50 px-4 text-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">
        Access denied
      </p>
      <h1 className="font-serif text-2xl font-semibold text-ink-900">
        You don&rsquo;t have permission to view this page
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-900/60">
        Your account role doesn&rsquo;t include access to this area. If you believe this is a
        mistake, contact your institution&rsquo;s administrator.
      </p>
      <Link
        href={homeHref}
        className="mt-6 rounded-sm bg-ink-900 px-5 py-2.5 text-sm font-medium text-parchment-50 hover:bg-ink-800"
      >
        Return home
      </Link>
    </div>
  );
}
