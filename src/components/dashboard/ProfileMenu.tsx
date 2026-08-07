"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { Role } from "@prisma/client";
import { getInitials } from "@/lib/utils/user";
import { routes } from "@/config/site";
import RoleBadge from "@/components/dashboard/RoleBadge";

export default function ProfileMenu({
  name,
  email,
  image,
  role,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const initials = getInitials(name, email);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2 rounded-sm py-1 pl-1 pr-2 transition-colors hover:bg-ink-900/5"
      >
        {image ? (
          <Image
            src={image}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-parchment-50">
            {initials}
          </span>
        )}
        <span className="hidden text-left sm:block">
          <span className="block max-w-[9rem] truncate text-sm font-medium text-ink-900">
            {name ?? email}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`text-ink-900/50 transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Profile menu"
          className="absolute right-0 z-40 mt-2 w-64 rounded-sm border border-ink-900/10 bg-white shadow-xl"
        >
          <div className="border-b border-ink-900/10 px-4 py-3">
            <p className="truncate text-sm font-medium text-ink-900">{name ?? "Account"}</p>
            <p className="truncate text-xs text-ink-900/50">{email}</p>
            <div className="mt-2">
              <RoleBadge role={role} />
            </div>
          </div>

          <div className="py-1">
            <span
              aria-disabled="true"
              className="flex cursor-not-allowed items-center gap-2.5 px-4 py-2 text-sm text-ink-900/35"
            >
              <UserRound size={16} aria-hidden="true" />
              Profile settings
              <span className="ml-auto rounded-sm border border-ink-900/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-900/35">
                Soon
              </span>
            </span>
            <span
              aria-disabled="true"
              className="flex cursor-not-allowed items-center gap-2.5 px-4 py-2 text-sm text-ink-900/35"
            >
              <Settings size={16} aria-hidden="true" />
              Preferences
              <span className="ml-auto rounded-sm border border-ink-900/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-900/35">
                Soon
              </span>
            </span>
          </div>

          <div className="border-t border-ink-900/10 py-1">
            <button
              role="menuitem"
              onClick={() => signOut({ callbackUrl: routes.login })}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-signal-error transition-colors hover:bg-signal-error/5"
            >
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
