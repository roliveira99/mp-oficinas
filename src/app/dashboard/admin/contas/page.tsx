"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionButton, DataTable } from "@/components/dashboard/DashboardUI";
import { PageHeader } from "@/components/dashboard/DashboardUI";
import { PermissionGuard } from "@/components/dashboard/PermissionGuard";
import { RoleBadge } from "@/components/dashboard/RoleBadge";
import {
  apiCreateUser,
  apiDeleteUser,
  fetchAdminUsers,
  fetchAdminWorkshops,
} from "@/lib/api/admin-client";
import { roleLabels } from "@/lib/permissions";
import type { UserRole } from "@/types/auth";
import type { Workshop } from "@/types/workshop";

const creatableRoles: { value: "dono" | "gerencia" | "mecanico"; label: string }[] = [
  { value: "dono", label: roleLabels.dono },
  { value: "gerencia", label: roleLabels.gerencia },
  { value: "mecanico", label: roleLabels.mecanico },
];

export default function AdminContasPage() {
  const [users, setUsers] = useState<Awaited<ReturnType<typeof fetchAdminUsers>>["users"]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "gerencia" as "dono" | "gerencia" | "mecanico",
    workshopId: "",
  });

  const refresh = useCallback(async () => {
    try {
      const [usersData, workshopsData] = await Promise.all([fetchAdminUsers(), fetchAdminWorkshops()]);
      setUsers(usersData.users);
      setWorkshops(workshopsData.workshops);
      if (!form.workshopId && workshopsData.workshops[0]) {
        setForm((f) => ({ ...f, workshopId: workshopsData.workshops[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar contas.");
    }
  }, [form.workshopId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const result = await apiCreateUser(form);
    if ("error" in result) {
      setError(result.error);
      return;
    }

    setMessage(`Conta criada: ${result.user.email} (${roleLabels[result.user.role as UserRole]})`);
    setShowForm(false);
    setForm((f) => ({ ...f, name: "", email: "", password: "" }));
    await refresh();
  }

  async function handleDelete(id: string, email: string, role: string) {
    if (role === "master") return;
    if (!confirm(`Remover a conta ${email}?`)) return;
    const result = await apiDeleteUser(id);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setMessage(`Conta ${email} removida.`);
    await refresh();
  }

  return (
    <PermissionGuard permissions={["admin.criar_contas"]}>
      <PageHeader
        title="Contas e acessos"
        description="Crie logins de dono, gerência e mecânicos para cada oficina"
        actions={
          <ActionButton
            label={showForm ? "Fechar formulário" : "+ Nova conta"}
            variant="primary"
            onClick={() => {
              setShowForm(!showForm);
              setError("");
            }}
          />
        }
      />

      {message && <p className="dash-alert">{message}</p>}
      {error && <p className="dash-alert dash-alert-error">{error}</p>}

      {workshops.length === 0 && (
        <p className="mb-4 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          Cadastre uma oficina em <strong>Oficinas</strong> antes de criar contas de acesso.
        </p>
      )}

      {showForm && workshops.length > 0 && (
        <form onSubmit={handleSubmit} className="card mb-8 space-y-4 p-5">
          <h2 className="font-semibold">Nova conta</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input required className="input-field" placeholder="Nome completo *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input required className="input-field" placeholder="E-mail *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input required className="input-field" placeholder="Senha inicial *" type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <select required className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}>
              {creatableRoles.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <select required className="input-field sm:col-span-2" value={form.workshopId} onChange={(e) => setForm({ ...form, workshopId: e.target.value })}>
              {workshops.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            Criar conta
          </button>
        </form>
      )}

      <DataTable
        headers={["Nome", "E-mail", "Perfil", "Oficina", "Ações"]}
        rows={users.map((u) => [
          u.name,
          u.email,
          <RoleBadge key={`r-${u.id}`} role={u.role as UserRole} />,
          u.workshopName ?? "—",
          u.role === "master" ? (
            <span key={`m-${u.id}`} className="text-xs text-muted">Protegido</span>
          ) : (
            <ActionButton key={`d-${u.id}`} label="Remover" variant="danger" onClick={() => void handleDelete(u.id, u.email, u.role)} />
          ),
        ])}
      />
    </PermissionGuard>
  );
}
