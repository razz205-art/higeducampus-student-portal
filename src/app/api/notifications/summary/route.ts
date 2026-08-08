import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getUnreadCount, getRecentSummaries } from "@/lib/data/notifications";
import { rateLimit } from "@/lib/security/rate-limit";

/**
 * Lightweight endpoint polled by the notification bell (and the browser
 * notification hook) — kept separate from the full /notifications page
 * query so periodic polling stays cheap. Normal polling is every 45-60s
 * per client; this limit is generous enough not to affect that while
 * still closing the gap against a scripted hammering.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { success } = rateLimit(`notifications-summary:${session.user.id}`, {
    limit: 120,
    windowMs: 60 * 60 * 1000,
  });
  if (!success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const [unreadCount, recent] = await Promise.all([
    getUnreadCount(session.user.id),
    getRecentSummaries(session.user.id, 6),
  ]);

  return NextResponse.json({ unreadCount, recent });
}
