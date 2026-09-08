"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { sendDailyScheduleNotifications } from "@/lib/notifications/daily-schedule";

export interface ActionResult {
  success: boolean;
  message: string;
}

function isAdmin(role: string | undefined): boolean {
  return role === "ACADEMIC_ADMIN" || role === "SUPER_ADMIN";
}

export async function sendDailyScheduleNotificationsAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "You must be signed in." };
  if (!isAdmin(session.user.role)) {
    return { success: false, message: "You don't have permission to do this." };
  }

  const result = await sendDailyScheduleNotifications();
  if (result.error) {
    return { success: false, message: result.error };
  }

  revalidatePath("/notifications");

  if (result.sent === 0) {
    return {
      success: true,
      message: result.message ?? "No classes scheduled today — nothing to send.",
    };
  }

  return {
    success: true,
    message: `Sent ${result.sent} notification${result.sent === 1 ? "" : "s"} (${result.coursesToday} course${result.coursesToday === 1 ? "" : "s"} have a class today).`,
  };
}
