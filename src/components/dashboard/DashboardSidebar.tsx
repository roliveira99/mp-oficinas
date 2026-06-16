"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { RoleBadge } from "@/components/dashboard/RoleBadge";
import { DemoProfileSwitcher } from "@/components/dashboard/DemoProfileSwitcher";
import { Logo } from "@/components/ui/Logo";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
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

  const navItems = getNavItems(user.role);
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
      className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col bg-sidebar text-sidebar-text transition-transform duration-200 ease-out lg:static lg:z-auto lg:max-w-none lg:shrink-0 lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="border-b border-sidebar-border px-5 py-5">
        <Logo variant="light" size="sm" />
      </div>

      <div className="border-b border-sidebar-border px-5 py-4">
        <p className="truncate text-sm font-medium text-white">{user.name}</p>
        <p className="truncate text-xs text-sidebar-text">{user.email}</p>
        {user.workshopName && (
          <p className="mt-0.5 truncate text-xs text-sidebar-text">
            {user.workshopName}
          </p>
        )}
        <div className="mt-3">
          <RoleBadge role={user.role} dark />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="mb-5">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-text/70">
              {group}
            </p>
            <div className="space-y-0.5">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive(item.href)
                      ? "bg-sidebar-hover font-medium text-sidebar-text-active"
                      : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                  }`}
                >
                  <Icon
                    name={item.icon as IconName}
                    className={`h-4 w-4 shrink-0 ${
                      isActive(item.href) ? "text-blue-400" : ""
                    }`}
                  />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <DemoProfileSwitcher onNavigate={onNavigate} />

      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-[11px] font-medium text-sidebar-text">Tema</span>
          <ThemeToggle variant="sidebar" />
        </div>
      </div>

      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-white"
        >
          <Icon name="logout" className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
