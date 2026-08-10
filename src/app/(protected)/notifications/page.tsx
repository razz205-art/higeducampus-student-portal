import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { routes } from "@/config/site";
import { getNotifications } from "@/lib/data/notifications";
import NotificationFilterBar from "@/components/notifications/NotificationFilterBar";
import NotificationCenterView from "@/components/notifications/NotificationCenterView";
import BrowserNotificationToggle from "@/components/notifications/BrowserNotificationToggle";
import type { NotificationCategory, NotificationFilter } from "@/types/notification";

export const metadata = { title: "Notifications" };

const VALID_CATEGORIES = new Set([
  "ANNOUNCEMENT",
  "EXAM_UPDATE",
  "SCHEDULE_CHANGE",
  "ASSIGNMENT_REMINDER",
  "FEE_REMINDER",
  "HOLIDAY_NOTICE",
  "PLACEMENT_UPDATE",
]);

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; filter?: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect(routes.login);
  }

  const isAdmin = session.user.role === "ACADEMIC_ADMIN" || session.user.role === "SUPER_ADMIN";
  const search = searchParams.q;
  const category = VALID_CATEGORIES.has(searchParams.category ?? "")
    ? (searchParams.category as NotificationCategory)
    : undefined;
  const filter: NotificationFilter =
    searchParams.filter === "unread" || searchParams.filter === "pinned"
      ? searchParams.filter
      : "all";

  const showPinnedSection = filter !== "pinned";

  const [pinned, items] = await Promise.all([
    showPinnedSection
      ? getNotifications(session.user.id, { search, category, filter: "pinned" })
      : Promise.resolve([]),
    getNotifications(session.user.id, {
      search,
      category,
      filter,
      excludePinned: showPinnedSection,
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl font-extrabold text-ink-900">Notifications</h1>
          <p className="mt-1 text-sm text-ink-900/50">
            Announcements, exam updates, schedule changes, and more — all in one place.
          </p>
        </div>
        <BrowserNotificationToggle />
      </div>

      <NotificationFilterBar search={search} category={category} filter={filter} />

      <NotificationCenterView pinned={pinned} items={items} isAdmin={isAdmin} />
    </div>
  );
}
