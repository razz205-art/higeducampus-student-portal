"use client";

import { useState, useTransition } from "react";
import { Power, Trash2, X, Pencil, ChevronDown, FolderOpen } from "lucide-react";
import {
  toggleUserActiveAction,
  deleteUserAction,
  setStudentBatchesAction,
} from "@/lib/actions/admin-users";
import DashboardCard from "@/components/dashboard/cards/DashboardCard";
import Badge from "@/components/ui/Badge";
import type { AdminUserRow } from "@/lib/data/admin-users";
import type { BatchOption } from "@/types/attendance";

function BatchEditor({
  user,
  batches,
  onDone,
}: {
  user: AdminUserRow;
  batches: BatchOption[];
  onDone: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(user.batchIds);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(batchId: string) {
    setSelectedIds((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
    );
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await setStudentBatchesAction(user.id, selectedIds);
      if (!res.success) {
        setError(res.message);
        return;
      }
      onDone();
    });
  }

  return (
    <div className="space-y-2 rounded-sm border border-gold-500/30 bg-gold-500/5 p-3">
      {error && <p className="text-xs text-signal-error">{error}</p>}
      {batches.length === 0 ? (
        <p className="text-xs text-ink-900/45">No batches exist yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {batches.map((b) => {
            const checked = selectedIds.includes(b.id);
            return (
              <label
                key={b.id}
                className={`flex cursor-pointer items-center gap-1.5 rounded-sm border px-2 py-1 text-xs ${
                  checked
                    ? "border-gold-500 bg-gold-500/10 text-ink-900"
                    : "border-ink-900/15 bg-white text-ink-900/70 hover:border-ink-900/30"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(b.id)}
                  className="h-3.5 w-3.5 accent-gold-500"
                />
                {b.name}
              </label>
            );
          })}
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-sm bg-ink-900 px-2.5 py-1 text-xs font-medium text-parchment-50 hover:bg-ink-800 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={isPending}
          className="rounded-sm px-2.5 py-1 text-xs font-medium text-ink-900/50 hover:text-ink-900 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Row({
  user,
  role,
  batches,
}: {
  user: AdminUserRow;
  role: "STUDENT" | "FACULTY";
  batches: BatchOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingBatches, setEditingBatches] = useState(false);

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
          {editingBatches ? (
            <BatchEditor user={user} batches={batches} onDone={() => setEditingBatches(false)} />
          ) : (
            <div className="flex flex-wrap items-center gap-1">
              {user.batchNames.length === 0 ? (
                <span className="text-ink-900/40">No batches</span>
              ) : (
                user.batchNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-sm border border-ink-900/10 bg-white px-1.5 py-0.5 text-xs"
                  >
                    {name}
                  </span>
                ))
              )}
              <button
                type="button"
                onClick={() => setEditingBatches(true)}
                aria-label="Edit batches"
                className="rounded-sm p-1 text-ink-900/40 hover:bg-ink-900/5 hover:text-ink-900"
              >
                <Pencil size={12} aria-hidden="true" />
              </button>
            </div>
          )}
          {user.registrationNumber && (
            <p className="mt-1 text-xs text-ink-900/40">{user.registrationNumber}</p>
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

function UserTable({
  users,
  role,
  batches,
}: {
  users: AdminUserRow[];
  role: "STUDENT" | "FACULTY";
  batches: BatchOption[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-ink-900/8 border-b text-xs uppercase tracking-wide text-ink-900/40">
            <th className="px-5 py-3 font-medium">Name</th>
            {role === "STUDENT" && <th className="px-5 py-3 font-medium">Batches</th>}
            <th className="px-5 py-3 font-medium">Courses</th>
            <th className="px-5 py-3 font-medium">Joined</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-ink-900/8 divide-y">
          {users.map((u) => (
            <Row key={u.id} user={u} role={role} batches={batches} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const UNASSIGNED_BATCH_KEY = "__unassigned__";

interface BatchGroup {
  key: string;
  name: string;
  students: AdminUserRow[];
}

// A student can belong to several batches (or none), so this isn't a
// strict partition — a multi-batch student appears once under each of
// their batches, and batchless students land in one "Unassigned" group.
function groupByBatch(students: AdminUserRow[], batches: BatchOption[]): BatchGroup[] {
  const nameById = new Map(batches.map((b) => [b.id, b.name]));
  const map = new Map<string, BatchGroup>();
  for (const s of students) {
    const keys = s.batchIds.length > 0 ? s.batchIds : [UNASSIGNED_BATCH_KEY];
    for (const key of keys) {
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: key === UNASSIGNED_BATCH_KEY ? "Unassigned" : (nameById.get(key) ?? "Unknown batch"),
          students: [],
        });
      }
      map.get(key)!.students.push(s);
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.key === UNASSIGNED_BATCH_KEY) return 1;
    if (b.key === UNASSIGNED_BATCH_KEY) return -1;
    return a.name.localeCompare(b.name);
  });
}

function BatchSection({
  group,
  isExpanded,
  onToggle,
  role,
  batches,
}: {
  group: BatchGroup;
  isExpanded: boolean;
  onToggle: () => void;
  role: "STUDENT" | "FACULTY";
  batches: BatchOption[];
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 bg-ink-900/[0.03] px-5 py-3 text-left transition-colors hover:bg-ink-900/[0.05]"
      >
        <span className="flex items-center gap-2.5">
          <FolderOpen size={15} className="text-gold-600" aria-hidden="true" />
          <span className="text-sm font-semibold text-ink-900">{group.name}</span>
          <span className="text-xs text-ink-900/40">
            {group.students.length} student{group.students.length === 1 ? "" : "s"}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-ink-900/40 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {isExpanded && <UserTable users={group.students} role={role} batches={batches} />}
    </div>
  );
}

export default function UserManagementTable({
  users,
  role,
  batches,
}: {
  users: AdminUserRow[];
  role: "STUDENT" | "FACULTY";
  batches: BatchOption[];
}) {
  const [batchFilter, setBatchFilter] = useState("all");
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());

  if (role !== "STUDENT") {
    return (
      <DashboardCard title="Faculty" bodyClassName="p-0">
        {users.length === 0 ? (
          <p className="p-5 text-center text-sm text-ink-900/45">No accounts found.</p>
        ) : (
          <UserTable users={users} role={role} batches={batches} />
        )}
      </DashboardCard>
    );
  }

  const visibleUsers =
    batchFilter === "all"
      ? users
      : batchFilter === UNASSIGNED_BATCH_KEY
        ? users.filter((u) => u.batchIds.length === 0)
        : users.filter((u) => u.batchIds.includes(batchFilter));
  const groups = groupByBatch(visibleUsers, batches);

  return (
    <div className="space-y-4">
      {users.length > 0 && (
        <div className="flex items-center gap-2">
          <label htmlFor="studentBatchFilter" className="text-xs font-medium text-ink-900/50">
            Batch
          </label>
          <select
            id="studentBatchFilter"
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="rounded-sm border border-ink-900/15 bg-white px-3 py-1.5 text-sm text-ink-900 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          >
            <option value="all">All batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
            <option value={UNASSIGNED_BATCH_KEY}>Unassigned</option>
          </select>
        </div>
      )}

      <DashboardCard title="Students" bodyClassName="p-0">
        {groups.length === 0 ? (
          <p className="p-5 text-center text-sm text-ink-900/45">No accounts found.</p>
        ) : (
          <div className="divide-ink-900/8 divide-y">
            {groups.map((group) => (
              <BatchSection
                key={group.key}
                group={group}
                isExpanded={!collapsedKeys.has(group.key)}
                onToggle={() =>
                  setCollapsedKeys((current) => {
                    const next = new Set(current);
                    if (next.has(group.key)) {
                      next.delete(group.key);
                    } else {
                      next.add(group.key);
                    }
                    return next;
                  })
                }
                role={role}
                batches={batches}
              />
            ))}
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
