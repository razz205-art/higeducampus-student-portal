import type { AttendanceStatus } from "@prisma/client";
import Badge from "@/components/ui/Badge";

const CONFIG: Record<
  AttendanceStatus,
  { label: string; variant: "success" | "danger" | "warning" }
> = {
  PRESENT: { label: "Present", variant: "success" },
  ABSENT: { label: "Absent", variant: "danger" },
  LEAVE: { label: "Leave", variant: "warning" },
};

export default function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const config = CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
