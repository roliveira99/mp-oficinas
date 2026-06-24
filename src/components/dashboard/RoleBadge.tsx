import type { UserRole } from "@/types/auth";
import type { BusinessVertical } from "@/types/vertical";
import { getRoleLabel } from "@/lib/permissions";

interface RoleBadgeProps {
  role: UserRole;
  vertical?: BusinessVertical | null;
  dark?: boolean;
}

export function RoleBadge({ role, vertical }: RoleBadgeProps) {
  return <span className="dash-badge">{getRoleLabel(role, vertical)}</span>;
}
