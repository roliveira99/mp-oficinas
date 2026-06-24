"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionButton, DataTable, PageHeader } from "@/components/dashboard/DashboardUI";
import { PermissionGuard } from "@/components/dashboard/PermissionGuard";

interface AdRow {
  id: string;
  title: string;
  body: string;
  price: number | null;
  contact: string | null;
  category: string;
  premium: boolean;
  active: boolean;
}

export default function ClassificadosDashboardPage() {
  const [ads, setAds] = useState<AdRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [price, setPrice] = useState("");
  const [contact, setContact] = useState("");
  const [category, setCategory] = useState("vendas");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/classifieds?mine=1");
    if (res.ok) {
      const data = (await res.json()) as { ads: AdRow[] };
      setAds(data.ads);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/classifieds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        title,
        body,
        price: price ? Number(price) : undefined,
        contact,
        category,
      }),
    });
    setTitle("");
    setBody("");
    setPrice("");
    setShowForm(false);
    await refresh();
  }

  return (
    <PermissionGuard permissions={["owner.cadastro_servicos"]}>
      <PageHeader
        title="Classificados"
        description="Publique anúncios na vitrine pública. Destaque premium no Jornal é definido pelo administrador."
        actions={<ActionButton label={showForm ? "Fechar" : "+ Novo anúncio"} variant="primary" onClick={() => setShowForm(!showForm)} />}
      />

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-3 p-5">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Título" />
          <textarea required value={body} onChange={(e) => setBody(e.target.value)} className="input-field min-h-[100px]" placeholder="Descrição" />
          <div className="grid gap-3 sm:grid-cols-3">
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="input-field" placeholder="Preço (opcional)" />
            <input value={contact} onChange={(e) => setContact(e.target.value)} className="input-field" placeholder="WhatsApp / contato" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
              <option value="vendas">Vendas</option>
              <option value="servicos">Serviços</option>
              <option value="veiculos">Veículos</option>
              <option value="pecas">Peças</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Publicar</button>
        </form>
      )}

      <DataTable
        headers={["Título", "Categoria", "Preço", "Premium", "Contato", "Status", "Ações"]}
        rows={ads.map((a) => [
          a.title,
          a.category,
          a.price != null ? `R$ ${a.price.toFixed(2)}` : "—",
          a.premium ? (
            <span key={`pr-${a.id}`} className="dash-badge">No jornal</span>
          ) : (
            "—"
          ),
          a.contact ?? "—",
          a.active ? "Ativo" : "Inativo",
          <ActionButton
            key={a.id}
            label={a.active ? "Desativar" : "Ativar"}
            onClick={() =>
              void fetch("/api/classifieds", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update", id: a.id, active: !a.active }),
              }).then(refresh)
            }
          />,
        ])}
      />
    </PermissionGuard>
  );
}
