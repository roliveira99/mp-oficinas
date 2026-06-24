import { platformMechanicsByWorkshop } from "@/data/platform-mechanics";
import type { AuthUser } from "@/types/auth";
import type { MechanicKind } from "@/types/client";

export interface MechanicScope {
  userId: string;
  name: string;
  legacyPlatformIds: string[];
}

export function getMechanicScopeForUser(user: AuthUser): MechanicScope | null {
  if (user.role !== "mecanico" || !user.workshopId) return null;

  const legacyPlatformIds = (platformMechanicsByWorkshop[user.workshopId] ?? [])
    .filter((m) => m.name === user.name)
    .map((m) => m.id);

  return {
    userId: user.id,
    name: user.name,
    legacyPlatformIds,
  };
}

export function matchesMechanicScope(
  row: {
    mechanicId?: string | null;
    mechanicKind?: MechanicKind | null;
    mechanicName?: string | null;
  },
  scope: MechanicScope
): boolean {
  if (row.mechanicKind === "platform") {
    if (row.mechanicId === scope.userId) return true;
    if (row.mechanicId && scope.legacyPlatformIds.includes(row.mechanicId)) return true;
  }
  if (row.mechanicName && row.mechanicName === scope.name) return true;
  return false;
}

export function mechanicNoteFilters(scope: MechanicScope): {
  mechanicId: string;
  mechanicKind: MechanicKind;
  alternateIds: string[];
} {
  const alternateIds = scope.legacyPlatformIds.filter((id) => id !== scope.userId);
  return {
    mechanicId: scope.userId,
    mechanicKind: "platform",
    alternateIds,
  };
}
