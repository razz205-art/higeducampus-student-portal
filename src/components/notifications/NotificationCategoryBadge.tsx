import Badge from "@/components/ui/Badge";
import { CATEGORY_CONFIG } from "@/config/notification-categories";
import type { NotificationCategory } from "@/types/notification";

export default function NotificationCategoryBadge({
  category,
}: {
  category: NotificationCategory;
}) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="inline-flex items-center gap-1">
      <Icon size={11} aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
