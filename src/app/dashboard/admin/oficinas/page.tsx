"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ActionButton, DataTable } from "@/components/dashboard/DashboardUI";
import { PageHeader } from "@/components/dashboard/DashboardUI";
import { PermissionGuard } from "@/components/dashboard/PermissionGuard";
import { WorkshopTypeBadge } from "@/components/workshop/WorkshopTypeBadge";
import {
  apiCreateWorkshop,
  apiDeleteWorkshop,
  fetchAdminWorkshops,
} from "@/lib/api/admin-client";
import type { Workshop, WorkshopType } from "@/types/workshop";

const types: { value: WorkshopType; label: string }[] = [
  { value: "carros", label: "Carros" },
  { value: "motos", label: "Motos" },
  { value: "mista", label: "Mista" },
  { value: "estetica", label: "Estética automotiva" },
];

export default function AdminOficinasPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    type: "carros" as WorkshopType,
    description: "",
    tagline: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    whatsapp: "",
    email: "",
    openingHours: "Seg–Sex 8h–18h",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    createOwner: true,
  });

  const refresh = useCallback(async () => {
    try {
      const data = await fetchAdminWorkshops();
      setWorkshops(data.workshops);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar oficinas.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const payload: Record<string, unknown> = {
      name: form.name,
      type: form.type,
      description: form.description,
      tagline: form.tagline || undefined,
      address: form.address,
      city: form.city,
      state: form.state,
      phone: form.phone,
      whatsapp: form.whatsapp || form.phone,
      email: form.email,
      openingHours: form.openingHours,
    };

    if (form.createOwner) {
      payload.ownerName = form.ownerName;
      payload.ownerEmail = form.ownerEmail;
      payload.ownerPassword = form.ownerPassword;
    }

    const result = await apiCreateWorkshop(payload);
    if ("error" in result) {
      setError(result.error);
      return;
    }

    setMessage(
      `Oficina "${result.workshop.name}" cadastrada. Perfil público: /oficinas/${result.workshop.slug}${
        result.ownerEmail ? ` — Dono: ${result.ownerEmail}` : ""
      }`
    );
    setShowForm(false);
    setForm((f) => ({
      ...f,
      name: "",
      description: "",
      tagline: "",
      address: "",
      city: "",
      ownerName: "",
      ownerEmail: "",
      ownerPassword: "",
    }));
    await refresh();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remover a oficina "${name}" e todos os dados vinculados?`)) return;
    const result = await apiDeleteWorkshop(id);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setMessage(`Oficina "${name}" removida.`);
    await refresh();
  }

  return (
    <PermissionGuard permissions={["admin.visualizar_oficinas", "admin.aprovar_oficinas"]}>
      <PageHeader
        title="Gestão de oficinas"
        description="Cadastre oficinas reais na plataforma e libere o perfil público"
        actions={
          <ActionButton
            label={showForm ? "Fechar formulário" : "+ Nova oficina"}
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

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8 space-y-5 p-5">
          <h2 className="font-semibold">Cadastrar oficina</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input required className="input-field" placeholder="Nome da oficina *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select required className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as WorkshopType })}>
              {types.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input required className="input-field" placeholder="E-mail de contato *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input required className="input-field sm:col-span-2 lg:col-span-3" placeholder="Descrição *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input className="input-field sm:col-span-2" placeholder="Frase de destaque (opcional)" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
            <input required className="input-field sm:col-span-2" placeholder="Endereço *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <input required className="input-field" placeholder="Cidade *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input required className="input-field" placeholder="UF *" maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} />
            <input required className="input-field" placeholder="Telefone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="input-field" placeholder="WhatsApp (opcional)" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            <input className="input-field" placeholder="Horário de funcionamento" value={form.openingHours} onChange={(e) => setForm({ ...form, openingHours: e.target.value })} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.createOwner} onChange={(e) => setForm({ ...form, createOwner: e.target.checked })} />
            Criar conta do dono junto com a oficina
          </label>

          {form.createOwner && (
            <div className="grid gap-3 rounded-lg border border-border bg-surface-hover/50 p-4 sm:grid-cols-3">
              <input required={form.createOwner} className="input-field" placeholder="Nome do dono *" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
              <input required={form.createOwner} className="input-field" placeholder="E-mail do dono *" type="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
              <input required={form.createOwner} className="input-field" placeholder="Senha inicial *" type="password" minLength={6} value={form.ownerPassword} onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })} />
            </div>
          )}

          <button type="submit" className="btn btn-primary">
            Cadastrar oficina
          </button>
        </form>
      )}

      {workshops.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma oficina cadastrada. Use o botão acima para adicionar a primeira.</p>
      ) : (
        <DataTable
          headers={["Oficina", "Tipo", "Cidade", "Perfil público", "Ações"]}
          rows={workshops.map((w) => [
            w.name,
            <WorkshopTypeBadge key={`t-${w.id}`} type={w.type} variant="system" />,
            `${w.city}/${w.state}`,
            <Link key={`l-${w.id}`} href={`/oficinas/${w.slug}`} className="dash-link" target="_blank">
              /oficinas/{w.slug}
            </Link>,
            <ActionButton key={`d-${w.id}`} label="Remover" variant="danger" onClick={() => void handleDelete(w.id, w.name)} />,
          ])}
        />
      )}
    </PermissionGuard>
  );
}
