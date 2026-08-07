"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { Role } from "@prisma/client";
import { ROLE_HOME } from "@/lib/rbac/permissions";

function toLabel(segment: string): string {
  return segment.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Breadcrumb({ role }: { role: Role }) {
  const pathname = usePathname();
  const homeHref = ROLE_HOME[role];

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, i) => ({
    label: toLabel(segment),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  const isAtHome = pathname === homeHref;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm text-ink-900/60">
      <ol className="flex items-center gap-1.5">
        <li className="flex items-center gap-1.5">
          {isAtHome ? (
            <span
              className="flex items-center gap-1.5 font-medium text-ink-900"
              aria-current="page"
            >
              <Home size={14} aria-hidden="true" />
              Home
            </span>
          ) : (
            <Link
              href={homeHref}
              className="flex items-center gap-1.5 transition-colors hover:text-ink-900"
            >
              <Home size={14} aria-hidden="true" />
              Home
            </Link>
          )}
        </li>
        {!isAtHome &&
          crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <li key={crumb.href} className="flex items-center gap-1.5">
                <ChevronRight size={14} className="text-ink-900/30" aria-hidden="true" />
                {isLast ? (
                  <span className="font-medium text-ink-900" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.href} className="transition-colors hover:text-ink-900">
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
      </ol>
    </nav>
  );
}
