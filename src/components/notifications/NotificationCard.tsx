"use client";

import { useState, useTransition } from "react";
import { Pin, Pencil, Trash2, ChevronDown } from "lucide-react";
import {
  markNotificationReadAction,
  togglePinAction,
  deleteNotificationAction,
} from "@/lib/actions/notifications";
import { formatRelativeTime } from "@/lib/utils/date";
import NotificationCategoryBadge from "@/components/notifications/NotificationCategoryBadge";
import AttachmentPreview from "@/components/notifications/AttachmentPreview";
import type { NotificationItem } from "@/types/notification";

export default function NotificationCard({
  notification,
  isAdmin,
  onEdit,
}: {
  notification: NotificationItem;
  isAdmin: boolean;
  onEdit?: (notification: NotificationItem) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRead, setIsRead] = useState(notification.isRead);
  const [, startTransition] = useTransition();

  function handleToggle() {
    const next = !isOpen;
    setIsOpen(next);
    if (next && !isRead) {
      setIsRead(true);
      startTransition(() => {
        markNotificationReadAction(notification.id);
      });
    }
  }

  function handleTogglePin(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(() => {
      togglePinAction(notification.id, !notification.isPinned);
    });
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete "${notification.title}"? This cannot be undone.`)) return;
    startTransition(() => {
      deleteNotificationAction(notification.id);
    });
  }

  return (
    <div
      className={`rounded-sm border bg-white transition-colors ${
        notification.isPinned ? "border-gold-500/40" : "border-ink-900/10"
      }`}
    >
      <button onClick={handleToggle} className="flex w-full items-start gap-3 p-4 text-left">
        {!isRead && (
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-500" aria-label="Unread" />
        )}
        <div className={`min-w-0 flex-1 ${isRead ? "pl-5" : ""}`}>
          <div className="flex flex-wrap items-center gap-2">
            {notification.isPinned && (
              <Pin size={12} className="shrink-0 text-gold-600" aria-hidden="true" />
            )}
            <h3
              className={`truncate text-sm ${isRead ? "font-medium text-ink-900/70" : "font-semibold text-ink-900"}`}
            >
              {notification.title}
            </h3>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-900/45">
            <NotificationCategoryBadge category={notification.category} />
            <span>{formatRelativeTime(notification.createdAt)}</span>
            <span>&middot;</span>
            <span>{notification.createdByName}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isAdmin && (
            <>
              <span
                onClick={handleTogglePin}
                role="button"
                tabIndex={0}
                aria-label={notification.isPinned ? "Unpin" : "Pin"}
                title={notification.isPinned ? "Unpin" : "Pin"}
                className="rounded-sm p-1.5 text-ink-900/40 hover:bg-ink-900/5 hover:text-gold-600"
              >
                <Pin size={14} aria-hidden="true" />
              </span>
              {onEdit && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(notification);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Edit"
                  title="Edit"
                  className="rounded-sm p-1.5 text-ink-900/40 hover:bg-ink-900/5 hover:text-ink-900"
                >
                  <Pencil size={14} aria-hidden="true" />
                </span>
              )}
              <span
                onClick={handleDelete}
                role="button"
                tabIndex={0}
                aria-label="Delete"
                title="Delete"
                className="rounded-sm p-1.5 text-ink-900/40 hover:bg-signal-error/10 hover:text-signal-error"
              >
                <Trash2 size={14} aria-hidden="true" />
              </span>
            </>
          )}
          <ChevronDown
            size={16}
            className={`text-ink-900/30 transition-transform ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </div>
      </button>

      {isOpen && (
        <div className="border-ink-900/8 border-t px-4 py-3 pl-8">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-900/75">
            {notification.body}
          </p>
          {notification.attachments.length > 0 && (
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {notification.attachments.map((a) => (
                <AttachmentPreview key={a.id} attachment={a} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
