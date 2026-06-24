"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { RoleBadge } from "@/components/dashboard/RoleBadge";
import { Logo } from "@/components/ui/Logo";
import { Icon, type IconName } from "@/components/ui/Icon";
import { DashboardThemeToggle } from "@/components/dashboard/DashboardThemeToggle";
import { getNavItems } from "@/lib/permissions";

export function DashboardSidebar({
  mobileOpen = false,
  onNavigate,
}: {
  mobileOpen?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  const navItems = getNavItems(user.role, user.workshopVertical);
  if (navItems.length === 0) return null;

  const grouped = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    const group = item.group ?? "Menu";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  async function handleLogout() {
    onNavigate?.();
    await logout();
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-60 max-w-[85vw] flex-col border-r border-[var(--dash-sidebar-border)] bg-[var(--dash-sidebar)] transition-transform duration-200 ease-out lg:static lg:z-auto lg:max-w-none lg:shrink-0 lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="border-b border-[var(--dash-sidebar-border)] px-4 py-4">
        <Logo variant="system" size="sm" />
      </div>

      <div className="border-b border-[var(--dash-sidebar-border)] px-4 py-3">
        <p className="truncate text-sm font-medium text-[var(--dash-sidebar-active-text)]">{user.name}</p>
        <p className="truncate text-xs text-[var(--dash-sidebar-text)]">{user.email}</p>
        {user.workshopName && (
          <p className="mt-0.5 truncate text-xs text-[var(--dash-sidebar-text)]">{user.workshopName}</p>
        )}
        <div className="mt-2">
          <RoleBadge role={user.role} vertical={user.workshopVertical} />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="mb-4">
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--dash-sidebar-text)]">
              {group}
            </p>
            <div className="space-y-0.5">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`dash-nav-item ${isActive(item.href) ? "dash-nav-item-active" : ""}`}
                >
                  <Icon name={item.icon as IconName} className="h-4 w-4 shrink-0 opacity-70" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--dash-sidebar-border)] px-3 py-3">
        <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wide text-[var(--dash-sidebar-text)]">
          Aparência
        </p>
        <DashboardThemeToggle className="w-full" />
      </div>

      <div className="border-t border-[var(--dash-sidebar-border)] p-2">
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="dash-nav-item w-full text-left"
        >
          <Icon name="logout" className="h-4 w-4 shrink-0 opacity-70" />
          Sair
        </button>
      </div>
    </aside>
  );
}
