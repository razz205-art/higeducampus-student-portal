"use client";

import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import CreateUserForm from "@/components/admin/CreateUserForm";
import BulkAddStudentsForm from "@/components/admin/BulkAddStudentsForm";
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
  const [mode, setMode] = useState<"none" | "single" | "bulk">("none");

  return (
    <div className="space-y-6">
      {mode === "none" && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMode("single")}
            className="flex items-center gap-1.5 rounded-sm bg-ink-900 px-3.5 py-2 text-xs font-medium text-parchment-50 hover:bg-ink-800"
          >
            <UserPlus size={14} aria-hidden="true" />
            Add {role === "STUDENT" ? "student" : "faculty"}
          </button>
          {role === "STUDENT" && (
            <button
              onClick={() => setMode("bulk")}
              className="flex items-center gap-1.5 rounded-sm border border-ink-900/15 px-3.5 py-2 text-xs font-medium text-ink-900 hover:bg-ink-900/5"
            >
              <Users size={14} aria-hidden="true" />
              Bulk add students
            </button>
          )}
        </div>
      )}
      {mode === "single" && <CreateUserForm role={role} batches={batches} courses={courses} />}
      {mode === "bulk" && <BulkAddStudentsForm onDone={() => setMode("none")} />}
      <UserManagementTable users={users} role={role} />
    </div>
  );
}
