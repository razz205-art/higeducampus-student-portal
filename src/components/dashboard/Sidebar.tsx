"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Role } from "@prisma/client";
import { cn } from "@/lib/utils/cn";
import { siteConfig } from "@/config/site";
import { getNavSections } from "@/config/navigation";
import RoleBadge from "@/components/dashboard/RoleBadge";

export default function Sidebar({
  role,
  onNavigate,
}: {
  role: Role;
  /** Called after a real nav link is clicked — used by MobileDrawer to close itself. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const sections = getNavSections(role);

  return (
    <nav aria-label="Primary" className="flex h-full w-full flex-col bg-ink-950 text-parchment-50">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-gold-500/15 text-gold-400">
          <GraduationCap size={20} strokeWidth={2} aria-hidden="true" />
        </span>
        <span className="font-serif text-lg font-semibold tracking-tight">{siteConfig.name}</span>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {sections.map((section, i) => (
          <div key={section.title ?? i}>
            {section.title && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-parchment-50/40">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = !!item.href && pathname === item.href;

                if (item.comingSoon || !item.href) {
                  return (
                    <li key={item.label}>
                      <span
                        aria-disabled="true"
                        className="flex cursor-not-allowed items-center justify-between gap-3 rounded-sm px-3 py-2 text-sm text-parchment-50/35"
                      >
                        <span className="flex items-center gap-3">
                          <Icon size={17} strokeWidth={2} aria-hidden="true" />
                          {item.label}
                        </span>
                        <span className="rounded-sm border border-parchment-50/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-parchment-50/40">
                          Soon
                        </span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-gold-500/15 text-gold-400"
                          : "text-parchment-50/80 hover:bg-white/5 hover:text-parchment-50"
                      )}
                    >
                      <Icon size={17} strokeWidth={2} aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-parchment-50/40">
          Signed in as
        </p>
        <RoleBadge role={role} />
      </div>
    </nav>
  );
}
