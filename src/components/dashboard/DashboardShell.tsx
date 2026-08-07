"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileDrawer from "@/components/dashboard/MobileDrawer";
import TopNav from "@/components/dashboard/TopNav";
import Footer from "@/components/dashboard/Footer";

export default function DashboardShell({
  role,
  userName,
  userEmail,
  userImage,
  children,
}: {
  role: Role;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  children: React.ReactNode;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-parchment-100">
      <div className="flex min-h-screen">
        {/* Persistent desktop sidebar */}
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="fixed h-screen w-64">
            <Sidebar role={role} />
          </div>
        </aside>

        {/* Mobile drawer (renders nothing visible until opened) */}
        <MobileDrawer role={role} isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

        {/* Main column */}
        <div className="flex min-h-screen flex-1 flex-col">
          <TopNav
            role={role}
            userName={userName}
            userEmail={userEmail}
            userImage={userImage}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
