import { NextRequest, NextResponse } from "next/server";
import { sendDailyScheduleNotifications } from "@/lib/notifications/daily-schedule";

/**
 * Runs automatically every morning (see vercel.json) and posts today's
 * class/exam schedule as a notification for every affected course. The
 * actual sending logic lives in lib/notifications/daily-schedule.ts,
 * shared with the admin's manual "Send Today's Schedule Now" trigger.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await sendDailyScheduleNotifications();
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json(result);
}
