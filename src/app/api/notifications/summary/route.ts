import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getUnreadCount, getRecentSummaries } from "@/lib/data/notifications";

/**
 * Lightweight endpoint polled by the notification bell (and the browser
 * notification hook) — kept separate from the full /notifications page
 * query so periodic polling stays cheap.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [unreadCount, recent] = await Promise.all([
    getUnreadCount(session.user.id),
    getRecentSummaries(session.user.id, 6),
  ]);

  return NextResponse.json({ unreadCount, recent });
}
