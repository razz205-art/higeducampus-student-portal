import Badge from "@/components/ui/Badge";
import type { ClassStatus } from "@/types/timetable";

const CONFIG: Record<
  ClassStatus,
  { label: string; variant: "success" | "info" | "neutral" | "warning" }
> = {
  ongoing: { label: "Ongoing", variant: "success" },
  upcoming: { label: "Upcoming", variant: "warning" },
  scheduled: { label: "Scheduled", variant: "info" },
  completed: { label: "Completed", variant: "neutral" },
};

export default function TimetableStatusBadge({ status }: { status: ClassStatus }) {
  const config = CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
