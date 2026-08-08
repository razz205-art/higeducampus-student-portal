"use client";

import { useTransition } from "react";
import { Power } from "lucide-react";
import { toggleUserActiveAction } from "@/lib/actions/admin-users";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Badge from "@/components/ui/Badge";
import type { AdminUserRow } from "@/lib/data/admin-users";

function Row({ user, role }: { user: AdminUserRow; role: "STUDENT" | "FACULTY" }) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(() => {
      toggleUserActiveAction(user.id, !user.isActive);
    });
  }

  return (
    <tr className={user.isActive ? "" : "opacity-50"}>
      <td className="px-5 py-3">
        <p className="font-medium text-ink-900">{user.name ?? "—"}</p>
        <p className="text-xs text-ink-900/45">{user.email}</p>
      </td>
      {role === "STUDENT" && (
        <td className="px-5 py-3 text-ink-900/70">
          {user.batchName ?? "—"}
          {user.registrationNumber && (
            <p className="text-xs text-ink-900/40">{user.registrationNumber}</p>
          )}
        </td>
      )}
      <td className="px-5 py-3 text-ink-900/70">
        {user.courseCount} {role === "STUDENT" ? "enrolled" : "teaching"}
      </td>
      <td className="px-5 py-3 text-ink-900/60">{user.createdAt}</td>
      <td className="px-5 py-3">
        <Badge variant={user.isActive ? "success" : "neutral"}>
          {user.isActive ? "Active" : "Disabled"}
        </Badge>
      </td>
      <td className="px-5 py-3 text-right">
        <button
          onClick={toggle}
          disabled={isPending}
          aria-label={user.isActive ? "Disable account" : "Enable account"}
          className="rounded-sm p-1.5 text-ink-900/50 hover:bg-ink-900/5 hover:text-ink-900 disabled:opacity-50"
        >
          <Power size={15} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}

export default function UserManagementTable({
  users,
  role,
}: {
  users: AdminUserRow[];
  role: "STUDENT" | "FACULTY";
}) {
  return (
    <DashboardCard title={role === "STUDENT" ? "Students" : "Faculty"} bodyClassName="p-0">
      {users.length === 0 ? (
        <p className="p-5 text-center text-sm text-ink-900/45">No accounts found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
                <th className="px-5 py-3 font-medium">Name</th>
                {role === "STUDENT" && <th className="px-5 py-3 font-medium">Batch</th>}
                <th className="px-5 py-3 font-medium">Courses</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-ink-900/8 divide-y">
              {users.map((u) => (
                <Row key={u.id} user={u} role={role} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
