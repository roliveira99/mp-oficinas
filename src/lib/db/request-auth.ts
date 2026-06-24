import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { getSessionUser, SESSION_COOKIE } from "@/lib/db/auth";
import type { AuthUser, Permission, UserRole } from "@/types/auth";
import { rolePermissions } from "@/lib/permissions";

export async function getRequestUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return getSessionUser(token);
}

export async function getRequestUserFromToken(
  request: NextRequest
): Promise<AuthUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return getSessionUser(token);
}

export function userHasPermission(user: AuthUser, permission: Permission): boolean {
  return rolePermissions[user.role]?.includes(permission) ?? false;
}

export function userCanManageAgenda(user: AuthUser): boolean {
  return userHasPermission(user, "owner.agenda") || userHasPermission(user, "gerencia.agenda");
}

export async function userHasEffectivePermission(
  user: AuthUser,
  permission: Permission
): Promise<boolean> {
  if (userHasPermission(user, permission)) return true;
  if (user.role !== "gerencia") return false;

  const { userHasGrant } = await import("@/lib/db/manager-permissions");
  return userHasGrant(user.id, permission).catch(() => false);
}

export function userHasRole(user: AuthUser, roles: UserRole[]): boolean {
  return roles.includes(user.role);
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getRequestUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requirePermission(permission: Permission): Promise<AuthUser> {
  const user = await requireAuth();
  if (!userHasPermission(user, permission)) throw new Error("FORBIDDEN");
  return user;
}
