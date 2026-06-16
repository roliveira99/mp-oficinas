"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { DEMO_ACCOUNTS } from "@/lib/auth";
import { roleLabels } from "@/lib/permissions";
import type { UserRole } from "@/types/auth";

export function DemoProfileSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const { user, setUser } = useAuth();
  const router = useRouter();

  function switchProfile(role: UserRole) {
    const account = DEMO_ACCOUNTS.find((a) => a.user.role === role);
    if (!account || account.user.email === user?.email) return;
    setUser(account.user);
    onNavigate?.();
    router.push("/dashboard");
  }

  return (
    <div className="border-t border-sidebar-border px-3 py-3">
      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-text/70">
        Trocar perfil (demo)
      </p>
      <div className="space-y-0.5">
        {DEMO_ACCOUNTS.map((account) => {
          const isActive = user?.email === account.email;
          return (
            <button
              key={account.email}
              type="button"
              onClick={() => switchProfile(account.user.role)}
              disabled={isActive}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                isActive
                  ? "bg-sidebar-hover font-medium text-white"
                  : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
              }`}
            >
              <span className="truncate">{roleLabels[account.user.role]}</span>
              <span className={`shrink-0 ${isActive ? "text-blue-400" : "text-blue-300/80"}`}>
                {isActive ? "Ativo" : "Ver"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
