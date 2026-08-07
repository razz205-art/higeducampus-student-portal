import { ROLE_LABEL } from "@/lib/rbac/permissions";
import { Role } from "@prisma/client";

export default function RoleBadge({ role }: { role: Role }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-gold-500/30 bg-gold-500/10 px-2.5 py-1 text-xs font-medium text-gold-600">
      {ROLE_LABEL[role]}
    </span>
  );
}
