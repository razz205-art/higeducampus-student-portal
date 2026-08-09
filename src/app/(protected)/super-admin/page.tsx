import { redirect } from "next/navigation";

/**
 * Super Admin has no dedicated dashboard of its own — it's explicitly
 * granted access to every area of the app (see lib/rbac/permissions.ts),
 * including the full Academic Admin dashboard. Rather than build and
 * maintain a second, near-identical admin surface, Super Admin lands
 * directly in the one that already exists.
 */
export default function SuperAdminPage() {
  redirect("/academic-admin");
}
