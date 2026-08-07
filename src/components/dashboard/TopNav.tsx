"use client";

import { Menu } from "lucide-react";
import { Role } from "@prisma/client";
import Breadcrumb from "@/components/dashboard/Breadcrumb";
import NotificationBell from "@/components/dashboard/NotificationBell";
import ProfileMenu from "@/components/dashboard/ProfileMenu";

export default function TopNav({
  role,
  userName,
  userEmail,
  userImage,
  onOpenDrawer,
}: {
  role: Role;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  onOpenDrawer: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-900/10 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onOpenDrawer}
          aria-label="Open navigation menu"
          className="rounded-sm p-2 text-ink-900/70 transition-colors hover:bg-ink-900/5 hover:text-ink-900 md:hidden"
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <Breadcrumb role={role} />
        </div>

        <div className="flex items-center gap-1.5">
          <NotificationBell />
          <ProfileMenu name={userName} email={userEmail} image={userImage} role={role} />
        </div>
      </div>
    </header>
  );
}
