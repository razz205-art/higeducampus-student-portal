"use client";

import { useCallback, useEffect, useState } from "react";

const ENABLED_KEY = "lms:browser-notifications-enabled";
const LAST_SEEN_KEY = "lms:browser-notifications-last-seen";
const POLL_INTERVAL_MS = 45_000;

interface RecentNotification {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  isRead: boolean;
}

/**
 * Wraps the standard Web Notification API (not the Push API): while this
 * tab is open, it polls for new notifications and shows native OS
 * notification popups for ones the user hasn't seen yet. This does not
 * cover notifications while the browser is fully closed — that needs a
 * service worker + VAPID keys + a push subscription backend, a genuine
 * infrastructure addition left for a future pass (see module notes).
 */
export function useBrowserNotifications() {
  const isSupported = typeof window !== "undefined" && "Notification" in window;
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : "denied"
  );
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    setEnabled(localStorage.getItem(ENABLED_KEY) === "true");
    setPermission(Notification.permission);
  }, [isSupported]);

  const requestEnable = useCallback(async () => {
    if (!isSupported) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      localStorage.setItem(ENABLED_KEY, "true");
      setEnabled(true);
    }
  }, [isSupported]);

  const disable = useCallback(() => {
    localStorage.setItem(ENABLED_KEY, "false");
    setEnabled(false);
  }, []);

  useEffect(() => {
    if (!isSupported || !enabled || permission !== "granted") return;

    async function poll() {
      try {
        const res = await fetch("/api/notifications/summary");
        if (!res.ok) return;
        const data: { recent: RecentNotification[] } = await res.json();

        const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
        const lastSeenMs = lastSeen ? new Date(lastSeen).getTime() : 0;

        const fresh = data.recent
          .filter((n) => new Date(n.createdAt).getTime() > lastSeenMs)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        for (const n of fresh) {
          new Notification(n.title, {
            body: "New notification from HiG EDUCAMPUS",
            tag: n.id,
          });
        }

        if (data.recent.length > 0) {
          const newest = data.recent.reduce((max, n) =>
            new Date(n.createdAt) > new Date(max.createdAt) ? n : max
          );
          localStorage.setItem(LAST_SEEN_KEY, newest.createdAt);
        }
      } catch {
        // Silently skip this poll — network hiccups shouldn't surface to the user.
      }
    }

    // Seed lastSeen on first enable so the initial poll doesn't fire a
    // notification for every pre-existing item.
    if (!localStorage.getItem(LAST_SEEN_KEY)) {
      localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isSupported, enabled, permission]);

  return { isSupported, permission, enabled, requestEnable, disable };
}
