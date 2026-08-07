import { Role } from "@prisma/client";
import { siteConfig } from "@/config/site";
import RoleBadge from "@/components/layout/RoleBadge";
import SignOutButton from "@/components/layout/SignOutButton";

/**
 * Shared header for all authenticated (protected) areas of the app.
 * Individual role dashboards render inside this shell once built.
 */
export default function Header({ userEmail, role }: { userEmail: string; role: Role }) {
  return (
    <header className="border-b border-ink-900/10 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="font-serif text-lg font-semibold text-ink-900">{siteConfig.name}</span>
          <RoleBadge role={role} />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-ink-900/60">{userEmail}</span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
