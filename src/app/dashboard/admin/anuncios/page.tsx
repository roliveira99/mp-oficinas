"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionButton, DataTable, PageHeader, TabPanel } from "@/components/dashboard/DashboardUI";
import { PermissionGuard } from "@/components/dashboard/PermissionGuard";
import {
  apiAddAnnouncement,
  apiDeleteAnnouncement,
  apiFetchAllAnnouncements,
  apiToggleAnnouncement,
} from "@/lib/api/platform-client";
import type { AnnouncementDisplayType, AnnouncementPlacement, AnnouncementStyle, SiteAnnouncement } from "@/types/platform-admin";

const placements: { value: AnnouncementPlacement; label: string }[] = [
  { value: "site_geral", label: "Site inteiro (banner)" },
  { value: "home_topo", label: "Home — topo" },
  { value: "home_meio", label: "Home — meio" },
  { value: "oficinas_topo", label: "Diretório de oficinas" },
];

const styles: { value: AnnouncementStyle; label: string }[] = [
  { value: "info", label: "Informativo" },
  { value: "promo", label: "Promoção" },
  { value: "alerta", label: "Alerta" },
];

interface ArticleRow {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  active: boolean;
}

export default function AdminAnunciosPage() {
  const [tab, setTab] = useState("banners");
  const [items, setItems] = useState<SiteAnnouncement[]>([]);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [placement, setPlacement] = useState<AnnouncementPlacement>("site_geral");
  const [style, setStyle] = useState<AnnouncementStyle>("info");
  const [displayType, setDisplayType] = useState<AnnouncementDisplayType>("banner");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleSummary, setArticleSummary] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [feedback, setFeedback] = useState("");

  const refresh = useCallback(async () => {
    setItems(await apiFetchAllAnnouncements());
    const res = await fetch("/api/articles?admin=1");
    if (res.ok) {
      const data = (await res.json()) as { articles: ArticleRow[] };
      setArticles(data.articles);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreateAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    await apiAddAnnouncement({ title, message, placement, style, linkUrl, linkLabel, mediaUrl, displayType });
    setTitle("");
    setMessage("");
    setLinkUrl("");
    setLinkLabel("");
    setMediaUrl("");
    setShowForm(false);
    setFeedback(displayType === "modal" ? "Pop-up publicado no site." : "Banner publicado.");
    await refresh();
  }

  async function handleCreateArticle(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsert",
        title: articleTitle,
        summary: articleSummary,
        content: articleContent,
      }),
    });
    setArticleTitle("");
    setArticleSummary("");
    setArticleContent("");
    setShowArticleForm(false);
    setFeedback("Notícia publicada.");
    await refresh();
  }

  const tabs = [
    {
      id: "banners",
      label: "Banners e pop-ups",
      content: (
        <div>
          <div className="mb-4 flex justify-end">
            <ActionButton label={showForm ? "Cancelar" : "+ Novo banner/pop-up"} variant="primary" onClick={() => setShowForm(!showForm)} />
          </div>
          {showForm && (
            <form onSubmit={handleCreateAnnouncement} className="card mb-6 space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Título" />
                <select value={displayType} onChange={(e) => setDisplayType(e.target.value as AnnouncementDisplayType)} className="input-field">
                  <option value="banner">Banner</option>
                  <option value="modal">Pop-up modal</option>
                </select>
                <select value={placement} onChange={(e) => setPlacement(e.target.value as AnnouncementPlacement)} className="input-field">
                  {placements.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <select value={style} onChange={(e) => setStyle(e.target.value as AnnouncementStyle)} className="input-field">
                  {styles.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <textarea required value={message} onChange={(e) => setMessage(e.target.value)} className="input-field min-h-[80px]" placeholder="Mensagem" />
              <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} className="input-field" placeholder="URL de imagem/vídeo (opcional)" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="input-field" placeholder="Link (opcional)" />
                <input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} className="input-field" placeholder="Texto do link" />
              </div>
              <button type="submit" className="btn btn-primary">Publicar</button>
            </form>
          )}
          <DataTable
            headers={["Título", "Tipo", "Local", "Status", "Ações"]}
            rows={items.map((a) => [
              a.title,
              a.displayType === "modal" ? "Pop-up" : "Banner",
              placements.find((p) => p.value === a.placement)?.label ?? a.placement,
              a.active ? "Ativo" : "Inativo",
              <div key={a.id} className="flex gap-2">
                <ActionButton label={a.active ? "Desativar" : "Ativar"} onClick={() => void apiToggleAnnouncement(a.id, !a.active).then(refresh)} />
                <ActionButton label="Excluir" variant="danger" onClick={() => void apiDeleteAnnouncement(a.id).then(refresh)} />
              </div>,
            ])}
          />
        </div>
      ),
    },
    {
      id: "noticias",
      label: "Notícias",
      content: (
        <div>
          <div className="mb-4 flex justify-end">
            <ActionButton label={showArticleForm ? "Cancelar" : "+ Nova notícia"} variant="primary" onClick={() => setShowArticleForm(!showArticleForm)} />
          </div>
          {showArticleForm && (
            <form onSubmit={handleCreateArticle} className="card mb-6 space-y-3 p-5">
              <input required value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} className="input-field" placeholder="Título" />
              <input required value={articleSummary} onChange={(e) => setArticleSummary(e.target.value)} className="input-field" placeholder="Resumo" />
              <textarea required value={articleContent} onChange={(e) => setArticleContent(e.target.value)} className="input-field min-h-[120px]" placeholder="Conteúdo completo" />
              <button type="submit" className="btn btn-primary">Publicar notícia</button>
            </form>
          )}
          <DataTable
            headers={["Título", "Resumo", "Status", "Ações"]}
            rows={articles.map((a) => [
              a.title,
              a.summary.slice(0, 80),
              a.active ? "Ativo" : "Inativo",
              <ActionButton
                key={a.id}
                label="Excluir"
                variant="danger"
                onClick={() =>
                  void fetch("/api/articles", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "delete", id: a.id }),
                  }).then(refresh)
                }
              />,
            ])}
          />
        </div>
      ),
    },
  ];

  return (
    <PermissionGuard permissions={["admin.gerenciar_anuncios"]}>
      <PageHeader
        title="Conteúdo do site"
        description="Somente banners e pop-ups criados aqui aparecem no site. Escolha o local exato de cada anúncio."
      />
      {feedback && <p className="dash-alert mb-4">{feedback}</p>}
      <TabPanel tabs={tabs} activeTab={tab} onTabChange={setTab} />
    </PermissionGuard>
  );
}
