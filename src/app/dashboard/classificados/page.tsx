"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionButton, DataTable, PageHeader } from "@/components/dashboard/DashboardUI";
import { PermissionGuard } from "@/components/dashboard/PermissionGuard";
import { GalleryMediaPicker } from "@/components/ui/ImageFilePicker";
import { MediaPreview } from "@/components/ui/MediaPreview";
import { Icon } from "@/components/ui/Icon";
import { isDataVideoUrl } from "@/lib/media-url";

interface AdRow {
  id: string;
  title: string;
  body: string;
  price: number | null;
  contact: string | null;
  category: string;
  images: string[];
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
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [error, setError] = useState("");

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

  function addMediaItems(items: { url: string; mediaType: "image" | "video" }[]) {
    setMediaUrls((prev) => [...prev, ...items.map((item) => item.url)]);
  }

  function removeMedia(index: number) {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/classifieds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        title,
        body,
        price: price ? Number(price) : undefined,
        contact,
        category,
        images: mediaUrls.length > 0 ? mediaUrls : undefined,
      }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Falha ao publicar anúncio.");
      return;
    }
    setTitle("");
    setBody("");
    setPrice("");
    setContact("");
    setMediaUrls([]);
    setShowForm(false);
    await refresh();
  }

  return (
    <PermissionGuard permissions={["owner.classificados"]}>
      <PageHeader
        title="Classificados"
        description="Publique anúncios na vitrine pública com fotos e vídeos do seu dispositivo. Destaque premium no Jornal é definido pelo administrador."
        actions={<ActionButton label={showForm ? "Fechar" : "+ Novo anúncio"} variant="primary" onClick={() => setShowForm(!showForm)} />}
      />

      {error && <p className="dash-alert dash-alert-error mb-4">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-4 p-5">
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

          <div>
            <p className="text-sm font-medium text-foreground">Fotos e vídeos (opcional)</p>
            <p className="mt-0.5 text-xs text-muted">
              Selecione da galeria do celular ou computador. Vídeos até 5 MB.
            </p>
            <div className="mt-3">
              <GalleryMediaPicker onAdd={addMediaItems} />
            </div>
            {mediaUrls.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {mediaUrls.map((url, index) => (
                  <figure key={`${index}-${url.slice(0, 24)}`} className="group relative overflow-hidden rounded-xl border border-border">
                    <MediaPreview
                      src={url}
                      alt=""
                      className="aspect-video w-full object-cover"
                      videoClassName="aspect-video w-full object-cover"
                      controls={false}
                    />
                    <figcaption className="border-t border-border px-2 py-1 text-[10px] text-muted">
                      {isDataVideoUrl(url) ? "Vídeo" : "Foto"}
                    </figcaption>
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remover mídia"
                    >
                      <Icon name="x" className="h-4 w-4" />
                    </button>
                  </figure>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary">Publicar</button>
        </form>
      )}

      <DataTable
        headers={["Título", "Categoria", "Preço", "Mídia", "Premium", "Contato", "Status", "Ações"]}
        rows={ads.map((a) => [
          a.title,
          a.category,
          a.price != null ? `R$ ${a.price.toFixed(2)}` : "—",
          a.images.length > 0 ? `${a.images.length} arquivo${a.images.length === 1 ? "" : "s"}` : "—",
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
