"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import CreateUserForm from "@/components/admin/CreateUserForm";
import UserManagementTable from "@/components/admin/UserManagementTable";
import type { AdminUserRow } from "@/lib/data/admin-users";
import type { BatchOption, CourseOption } from "@/types/attendance";

export default function UserManagementView({
  users,
  role,
  batches,
  courses,
}: {
  users: AdminUserRow[];
  role: "STUDENT" | "FACULTY";
  batches: BatchOption[];
  courses: CourseOption[];
}) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      {!showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-sm bg-ink-900 px-3.5 py-2 text-xs font-medium text-parchment-50 hover:bg-ink-800"
        >
          <UserPlus size={14} aria-hidden="true" />
          Add {role === "STUDENT" ? "student" : "faculty"}
        </button>
      )}
      {showCreate && <CreateUserForm role={role} batches={batches} courses={courses} />}
      <UserManagementTable users={users} role={role} />
    </div>
  );
}
