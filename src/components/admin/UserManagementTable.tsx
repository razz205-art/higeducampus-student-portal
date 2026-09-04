"use client";

import { useState, useTransition } from "react";
import { Power, Trash2, X } from "lucide-react";
import { toggleUserActiveAction, deleteUserAction } from "@/lib/actions/admin-users";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Badge from "@/components/ui/Badge";
import type { AdminUserRow } from "@/lib/data/admin-users";

function Row({ user, role }: { user: AdminUserRow; role: "STUDENT" | "FACULTY" }) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function toggle() {
    startTransition(() => {
      toggleUserActiveAction(user.id, !user.isActive);
    });
  }

  function confirmDelete() {
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteUserAction(user.id);
      if (!result.success) {
        setDeleteError(result.message);
        setConfirmingDelete(false);
      }
      // On success the row disappears once revalidatePath refreshes the
      // list — no local state update needed here.
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
        {confirmingDelete ? (
          <div className="flex items-center justify-end gap-2">
            {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
            <span className="text-xs font-medium text-red-700">Delete permanently?</span>
            <button
              onClick={confirmDelete}
              disabled={isPending}
              className="rounded-sm bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              disabled={isPending}
              aria-label="Cancel delete"
              className="rounded-sm p-1.5 text-ink-900/50 hover:bg-ink-900/5 hover:text-ink-900 disabled:opacity-50"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={toggle}
              disabled={isPending}
              aria-label={user.isActive ? "Disable account" : "Enable account"}
              className="rounded-sm p-1.5 text-ink-900/50 hover:bg-ink-900/5 hover:text-ink-900 disabled:opacity-50"
            >
              <Power size={15} aria-hidden="true" />
            </button>
            <button
              onClick={() => {
                setDeleteError(null);
                setConfirmingDelete(true);
              }}
              disabled={isPending}
              aria-label="Delete permanently"
              title="Delete permanently — this cannot be undone"
              className="rounded-sm p-1.5 text-ink-900/50 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
        )}
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
