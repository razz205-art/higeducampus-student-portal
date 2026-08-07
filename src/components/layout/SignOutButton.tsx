"use client";

import { signOut } from "next-auth/react";
import { routes } from "@/config/site";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: routes.login })}
      className="rounded-sm border border-ink-900/15 px-4 py-2 text-sm font-medium text-ink-900 transition-colors hover:bg-ink-900/5"
    >
      Sign out
    </button>
  );
}
