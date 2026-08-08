"use client";

import { Bell, BellOff, BellRing } from "lucide-react";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";

export default function BrowserNotificationToggle() {
  const { isSupported, permission, enabled, requestEnable, disable } = useBrowserNotifications();

  if (!isSupported) return null;

  if (permission === "denied") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-ink-900/40">
        <BellOff size={13} aria-hidden="true" />
        Browser notifications are blocked — enable them in your browser&rsquo;s site settings.
      </p>
    );
  }

  if (enabled && permission === "granted") {
    return (
      <button
        onClick={disable}
        className="flex items-center gap-1.5 rounded-sm border border-signal-success/30 bg-signal-success/10 px-3 py-1.5 text-xs font-medium text-signal-success"
      >
        <BellRing size={13} aria-hidden="true" />
        Browser notifications on
      </button>
    );
  }

  return (
    <button
      onClick={requestEnable}
      className="flex items-center gap-1.5 rounded-sm border border-ink-900/15 px-3 py-1.5 text-xs font-medium text-ink-900/60 transition-colors hover:bg-ink-900/5"
    >
      <Bell size={13} aria-hidden="true" />
      Enable browser notifications
    </button>
  );
}
