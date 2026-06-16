"use client";

import type { AdminUserRow } from "@/lib/db/admin";
import type { Workshop } from "@/types/workshop";

const fetchOpts: RequestInit = { credentials: "include" };

export async function fetchAdminWorkshops(): Promise<{ workshops: Workshop[] }> {
  const res = await fetch("/api/admin/workshops", fetchOpts);
  if (res.status === 401) throw new Error("Sessão expirada. Faça login novamente.");
  if (!res.ok) throw new Error("Falha ao carregar oficinas.");
  return res.json() as Promise<{ workshops: Workshop[] }>;
}

export async function apiCreateWorkshop(input: Record<string, unknown>) {
  const res = await fetch("/api/admin/workshops", {
    ...fetchOpts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as
    | { ok: true; workshop: Workshop; ownerEmail?: string }
    | { error: string };
  if (res.status === 401) return { error: "Sessão expirada. Faça login novamente." };
  return data;
}

export async function apiDeleteWorkshop(id: string) {
  const res = await fetch(`/api/admin/workshops?id=${encodeURIComponent(id)}`, {
    ...fetchOpts,
    method: "DELETE",
  });
  if (res.status === 401) return { error: "Sessão expirada. Faça login novamente." };
  return res.json() as Promise<{ ok: true } | { error: string }>;
}

export async function fetchAdminUsers(): Promise<{ users: AdminUserRow[] }> {
  const res = await fetch("/api/admin/users", fetchOpts);
  if (res.status === 401) throw new Error("Sessão expirada. Faça login novamente.");
  if (!res.ok) throw new Error("Falha ao carregar contas.");
  return res.json() as Promise<{ users: AdminUserRow[] }>;
}

export async function apiCreateUser(input: {
  name: string;
  email: string;
  password: string;
  role: "dono" | "gerencia" | "mecanico";
  workshopId: string;
}) {
  const res = await fetch("/api/admin/users", {
    ...fetchOpts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { ok: true; user: AdminUserRow } | { error: string };
  if (res.status === 401) return { error: "Sessão expirada. Faça login novamente." };
  return data;
}

export async function apiDeleteUser(id: string) {
  const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
    ...fetchOpts,
    method: "DELETE",
  });
  if (res.status === 401) return { error: "Sessão expirada. Faça login novamente." };
  return res.json() as Promise<{ ok: true } | { error: string }>;
}
