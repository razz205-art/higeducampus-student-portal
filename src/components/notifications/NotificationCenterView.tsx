"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { markAllNotificationsReadAction } from "@/lib/actions/notifications";
import NotificationForm from "@/components/notifications/NotificationForm";
import NotificationCard from "@/components/notifications/NotificationCard";
import type { NotificationItem } from "@/types/notification";
import type { CourseOption, BatchOption } from "@/types/attendance";

export default function NotificationCenterView({
  pinned,
  items,
  isAdmin,
  courses,
  batches,
}: {
  pinned: NotificationItem[];
  items: NotificationItem[];
  isAdmin: boolean;
  courses: CourseOption[];
  batches: BatchOption[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<NotificationItem | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-900/50">
          {pinned.length + items.length} notification
          {pinned.length + items.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => markAllNotificationsReadAction()}
            className="text-xs font-medium text-ink-900/50 hover:text-ink-900"
          >
            Mark all as read
          </button>
          {isAdmin && !showCreate && !editing && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-sm bg-ink-900 px-3.5 py-2 text-xs font-medium text-parchment-50 hover:bg-ink-800"
            >
              <Plus size={14} aria-hidden="true" />
              New notification
            </button>
          )}
        </div>
      </div>

      {isAdmin && showCreate && (
        <NotificationForm
          courses={courses}
          batches={batches}
          onSaved={() => setShowCreate(false)}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {isAdmin && editing && (
        <NotificationForm
          initial={editing}
          courses={courses}
          batches={batches}
          onSaved={() => setEditing(null)}
          onCancel={() => setEditing(null)}
        />
      )}

      {pinned.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-900/40">Pinned</p>
          {pinned.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              isAdmin={isAdmin}
              onEdit={isAdmin ? setEditing : undefined}
            />
          ))}
        </div>
      )}

      <div className="space-y-2.5">
        {pinned.length > 0 && (
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-900/40">All</p>
        )}
        {items.length === 0 ? (
          <p className="rounded-sm border border-ink-900/10 bg-white p-8 text-center text-sm text-ink-900/45">
            No notifications match your filters.
          </p>
        ) : (
          items.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              isAdmin={isAdmin}
              onEdit={isAdmin ? setEditing : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
