import type { AuthUser } from "@/types/auth";
import { DEMO_ACCOUNTS } from "@/lib/auth";

const OFFLINE_SESSION_KEY = "mp-oficinas-offline-session";

export async function apiLogin(
  email: string,
  password: string
): Promise<{ user: AuthUser; offline?: boolean } | { error: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const data = (await res.json()) as {
    user?: AuthUser;
    error?: string;
    offline?: boolean;
  };

  if (!res.ok || !data.user) {
    return { error: data.error ?? "Falha no login." };
  }

  if (data.offline && typeof window !== "undefined") {
    sessionStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(data.user));
  } else if (typeof window !== "undefined") {
    sessionStorage.removeItem(OFFLINE_SESSION_KEY);
  }

  return { user: data.user, offline: data.offline };
}

export async function apiLogout(): Promise<void> {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(OFFLINE_SESSION_KEY);
  }
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

export async function apiGetSession(): Promise<AuthUser | null> {
  if (typeof window !== "undefined") {
    const offlineRaw = sessionStorage.getItem(OFFLINE_SESSION_KEY);
    if (offlineRaw) {
      try {
        return JSON.parse(offlineRaw) as AuthUser;
      } catch {
        sessionStorage.removeItem(OFFLINE_SESSION_KEY);
      }
    }
  }

  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) return null;
  const data = (await res.json()) as { user: AuthUser | null };
  return data.user;
}

export { DEMO_ACCOUNTS };
