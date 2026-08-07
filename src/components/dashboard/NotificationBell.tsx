"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellOff } from "lucide-react";

/**
 * Placeholder data hook: no notifications module/backend exists yet.
 * Swap this for a real fetch/subscription once one does — the panel below
 * already handles both the empty and populated cases.
 */
function useNotifications() {
  return { items: [] as { id: string; title: string; timestamp: string }[], unreadCount: 0 };
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { items, unreadCount } = useNotifications();

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
          <div className="border-b border-ink-900/10 px-4 py-3">
            <p className="text-sm font-semibold text-ink-900">Notifications</p>
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
                <li key={item.id} className="border-b border-ink-900/5 px-4 py-3 last:border-0">
                  <p className="text-sm text-ink-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-ink-900/45">{item.timestamp}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
