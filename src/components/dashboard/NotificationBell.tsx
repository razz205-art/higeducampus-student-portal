"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellOff } from "lucide-react";
import { markNotificationReadAction } from "@/lib/actions/notifications";
import { formatRelativeTime } from "@/lib/utils/date";
import { CATEGORY_CONFIG } from "@/config/notification-categories";
import type { NotificationSummary } from "@/types/notification";

const POLL_INTERVAL_MS = 60_000;

function useNotificationSummary() {
  const [items, setItems] = useState<NotificationSummary[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/notifications/summary");
        if (!res.ok || cancelled) return;
        const data: { unreadCount: number; recent: NotificationSummary[] } = await res.json();
        if (!cancelled) {
          setItems(data.recent);
          setUnreadCount(data.unreadCount);
        }
      } catch {
        // Silently skip — the bell just keeps showing its last known state.
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(c - 1, 0));
    markNotificationReadAction(id);
  }

  return { items, unreadCount, markRead };
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { items, unreadCount, markRead } = useNotificationSummary();

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative rounded-sm p-2 text-ink-900/70 transition-colors hover:bg-ink-900/5 hover:text-ink-900"
      >
        <Bell size={19} strokeWidth={2} aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold-500 ring-2 ring-white"
          />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] rounded-sm border border-ink-900/10 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-ink-900/10 px-4 py-3">
            <p className="text-sm font-semibold text-ink-900">Notifications</p>
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-gold-600 hover:underline"
            >
              View all
            </Link>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <BellOff size={22} className="text-ink-900/25" aria-hidden="true" />
              <p className="text-sm font-medium text-ink-900/70">You&rsquo;re all caught up</p>
              <p className="text-xs text-ink-900/45">
                Notifications will appear here once course and campus updates go live.
              </p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="border-b border-ink-900/5 last:border-0">
                  <button
                    onClick={() => markRead(item.id)}
                    className="flex w-full items-start gap-2 px-4 py-3 text-left hover:bg-ink-900/[0.02]"
                  >
                    {!item.isRead && (
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500"
                        aria-hidden="true"
                      />
                    )}
                    <span className={item.isRead ? "min-w-0 flex-1 pl-3.5" : "min-w-0 flex-1"}>
                      <span
                        className={`block truncate text-sm ${item.isRead ? "text-ink-900/60" : "font-medium text-ink-900"}`}
                      >
                        {item.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-900/45">
                        {CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG]?.label}
                        <span>&middot;</span>
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
