"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/DashboardUI";
import { PermissionGuard } from "@/components/dashboard/PermissionGuard";
import { GalleryMediaPicker, ImageFilePicker } from "@/components/ui/ImageFilePicker";
import { VideoFilePicker } from "@/components/ui/VideoFilePicker";
import { MediaPreview } from "@/components/ui/MediaPreview";
import { Icon } from "@/components/ui/Icon";
import { mediaUrlLabel } from "@/lib/media-url";
import { fetchWorkshopMedia, saveWorkshopMedia } from "@/lib/api/crm-client";
import type { WorkshopGalleryItem, WorkshopShowcaseItem } from "@/types/workshop";

export default function MidiaPage() {
  const [coverImage, setCoverImage] = useState("");
  const [tagline, setTagline] = useState("");
  const [slogan, setSlogan] = useState("");
  const [gallery, setGallery] = useState<WorkshopGalleryItem[]>([]);
  const [showcase, setShowcase] = useState<WorkshopShowcaseItem[]>([]);
  const [profileVideos, setProfileVideos] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<{ title: string; body: string }[]>([]);
  const [opportunities, setOpportunities] = useState<{ title: string; body: string }[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWorkshopMedia();
      setCoverImage(data.coverImage ?? "");
      setTagline(data.tagline ?? "");
      setSlogan(data.slogan ?? "");
      setGallery(data.gallery ?? []);
      setShowcase(data.profileShowcase ?? []);
      setProfileVideos(data.profileVideos ?? []);
      setHighlights(data.profileHighlights ?? []);
      setOpportunities(data.businessOpportunities ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);
    try {
      await saveWorkshopMedia({
        coverImage: coverImage.trim(),
        tagline: tagline.trim(),
        slogan: slogan.trim(),
        gallery,
        profileShowcase: showcase,
        profileVideos,
        profileHighlights: highlights,
        businessOpportunities: opportunities,
      });
      setMessage("Alterações salvas — visíveis no perfil público após recarregar a página.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  function addShowcaseItems(items: { url: string; mediaType: "image" | "video" }[]) {
    setShowcase((prev) => [
      ...prev,
      ...items.map((item, index) => ({
        id: `showcase-${Date.now()}-${index}`,
        url: item.url,
        mediaType: item.mediaType,
        title: "",
        price: null,
        label: "",
      })),
    ]);
  }

  function updateShowcaseItem(id: string, patch: Partial<WorkshopShowcaseItem>) {
    setShowcase((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeShowcaseItem(id: string) {
    setShowcase((prev) => prev.filter((item) => item.id !== id));
  }

  function addGalleryItems(items: { url: string; caption: string; mediaType: "image" | "video" }[]) {
    setGallery((prev) => [
      ...prev,
      ...items.map((item, index) => ({
        id: `gal-${Date.now()}-${index}`,
        url: item.url,
        caption: item.caption,
        kind: "ambiente" as const,
        mediaType: item.mediaType,
      })),
    ]);
  }

  function removeGalleryItem(id: string) {
    setGallery((prev) => prev.filter((g) => g.id !== id));
  }

  if (loading) {
    return (
      <PermissionGuard permissions={["owner.perfil"]}>
        <PageHeader title="Meu perfil no site" description="Carregando..." />
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard permissions={["owner.perfil"]}>
      <PageHeader
        title="Meu perfil no site"
        description="Fotos, vídeos, vitrine de produtos, slogans e informações exibidas na sua página pública"
      />

      {message && <p className="dash-alert">{message}</p>}
      {error && <p className="dash-alert dash-alert-error">{error}</p>}

      <form onSubmit={handleSave} className="space-y-6">
        <section className="card p-5">
          <h2 className="font-semibold text-foreground">Capa e destaque</h2>
          <p className="mt-1 text-sm text-muted">
            Escolha uma foto da galeria do seu celular ou computador. A capa aparece no topo do perfil
            público.
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <ImageFilePicker
              label="Foto de capa"
              hint="JPG, PNG ou WebP — até 12 MB. A imagem é otimizada automaticamente."
              value={coverImage}
              onChange={setCoverImage}
              onClear={() => setCoverImage("")}
              buttonLabel="Escolher foto de capa"
            />
            <div className="space-y-4">
              <label className="block text-sm">
                <span className="font-medium">Slogan</span>
                <input
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  className="input-field mt-1.5"
                  placeholder="Ex.: Qualidade que você confia"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Frase de destaque (tagline)</span>
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="input-field mt-1.5"
                  placeholder="Ex.: Especialistas em injeção eletrônica"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold text-foreground">Vídeos do perfil</h2>
          <p className="mt-1 text-sm text-muted">
            Escolha vídeos do celular ou computador, ou cole um link do YouTube/Vimeo.
          </p>

          <div className="mt-4 space-y-4">
            <VideoFilePicker
              key={`device-video-${profileVideos.length}`}
              label="Vídeo do dispositivo"
              hint="MP4, WebM ou MOV — até 5 MB. Prefira clipes curtos."
              onChange={(url) => setProfileVideos((p) => [...p, url])}
              buttonLabel="Escolher vídeo do dispositivo"
              previewClassName="hidden"
            />

            <div className="flex gap-2">
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="input-field flex-1"
                placeholder="https://youtube.com/... (opcional)"
              />
              <button
                type="button"
                onClick={() => {
                  if (!videoUrl.trim()) return;
                  setProfileVideos((p) => [...p, videoUrl.trim()]);
                  setVideoUrl("");
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm"
              >
                Adicionar link
              </button>
            </div>
          </div>

          {profileVideos.length > 0 && (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {profileVideos.map((v, i) => (
                <li key={`${i}-${v.slice(0, 20)}`} className="group relative overflow-hidden rounded-xl border border-border">
                  <MediaPreview src={v} videoClassName="aspect-video w-full" className="aspect-video w-full object-cover" />
                  <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs text-muted">
                    <span>{mediaUrlLabel(v)}</span>
                    <button
                      type="button"
                      className="text-danger"
                      onClick={() => setProfileVideos((p) => p.filter((_, j) => j !== i))}
                    >
                      Remover
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-semibold text-foreground">Vitrine de produtos</h2>
          <p className="mt-1 text-sm text-muted">
            Ideal para lojas de roupas e comércio: publique fotos ou vídeos com preço ou texto livre
            (promoção, tamanho, condição de pagamento).
          </p>

          <div className="mt-4">
            <GalleryMediaPicker onAdd={addShowcaseItems} />
          </div>

          {showcase.length > 0 ? (
            <ul className="mt-6 grid gap-4 lg:grid-cols-2">
              {showcase.map((item) => (
                <li key={item.id} className="overflow-hidden rounded-xl border border-border">
                  <div className="grid gap-0 sm:grid-cols-[140px_1fr]">
                    <MediaPreview
                      src={item.url}
                      alt={item.title ?? "Produto"}
                      className="aspect-square h-full w-full object-cover sm:min-h-[140px]"
                      videoClassName="aspect-square h-full w-full object-cover sm:min-h-[140px]"
                    />
                    <div className="space-y-3 border-t border-border p-4 sm:border-l sm:border-t-0">
                      <input
                        value={item.title ?? ""}
                        onChange={(e) => updateShowcaseItem(item.id, { title: e.target.value })}
                        className="input-field"
                        placeholder="Nome do produto (opcional)"
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm">
                          <span className="font-medium">Preço (R$)</span>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.price ?? ""}
                            onChange={(e) =>
                              updateShowcaseItem(item.id, {
                                price: e.target.value ? Number(e.target.value) : null,
                              })
                            }
                            className="input-field mt-1"
                            placeholder="Ex.: 89,90"
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="font-medium">Texto livre</span>
                          <input
                            value={item.label ?? ""}
                            onChange={(e) => updateShowcaseItem(item.id, { label: e.target.value })}
                            className="input-field mt-1"
                            placeholder="Ex.: Promoção, Tam. M, 3x sem juros"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-muted">
                        Use preço, texto livre ou os dois. No perfil público, o preço aparece em destaque.
                      </p>
                      <button
                        type="button"
                        onClick={() => removeShowcaseItem(item.id)}
                        className="text-sm text-danger"
                      >
                        Remover item
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">Nenhum produto na vitrine ainda.</p>
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-semibold text-foreground">Destaques e oportunidades</h2>
          <ProfileBlockEditor
            label="Informações relevantes"
            items={highlights}
            onChange={setHighlights}
          />
          <div className="mt-6">
            <ProfileBlockEditor
              label="Oportunidades de negócio"
              items={opportunities}
              onChange={setOpportunities}
            />
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold text-foreground">Galeria de fotos e vídeos</h2>
          <p className="mt-1 text-sm text-muted">
            Adicione fotos ou vídeos do seu dispositivo — ambiente, equipe, produtos ou serviços.
          </p>

          <div className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="font-medium">Legenda padrão (opcional)</span>
              <input
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                className="input-field mt-1.5 max-w-md"
                placeholder="Ex.: Nossa loja"
              />
            </label>
            <GalleryMediaPicker caption={newCaption} onAdd={addGalleryItems} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((item) => (
              <figure key={item.id} className="group relative overflow-hidden rounded-xl border border-border">
                <MediaPreview
                  src={item.url}
                  alt={item.caption ?? "Mídia do perfil"}
                  className="aspect-video w-full object-cover"
                  videoClassName="aspect-video w-full object-cover"
                />
                {item.caption && (
                  <figcaption className="border-t border-border px-3 py-2 text-xs text-muted">
                    {item.caption}
                  </figcaption>
                )}
                <button
                  type="button"
                  onClick={() => removeGalleryItem(item.id)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remover mídia"
                >
                  <Icon name="x" className="h-4 w-4" />
                </button>
              </figure>
            ))}
          </div>
          {gallery.length === 0 && (
            <p className="mt-4 text-sm text-muted">Nenhuma foto ou vídeo na galeria ainda.</p>
          )}
        </section>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Salvando…" : "Salvar alterações"}
        </button>
      </form>
    </PermissionGuard>
  );
}

function ProfileBlockEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: { title: string; body: string }[];
  onChange: (items: { title: string; body: string }[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Título" />
        <input value={body} onChange={(e) => setBody(e.target.value)} className="input-field" placeholder="Descrição" />
      </div>
      <button
        type="button"
        className="mt-2 text-sm text-accent"
        onClick={() => {
          if (!title.trim()) return;
          onChange([...items, { title: title.trim(), body: body.trim() }]);
          setTitle("");
          setBody("");
        }}
      >
        + Adicionar bloco
      </button>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item, i) => (
          <li key={`${item.title}-${i}`} className="rounded border border-border p-3">
            <strong>{item.title}</strong>
            <p className="text-muted">{item.body}</p>
            <button
              type="button"
              className="mt-1 text-xs text-danger"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              Remover
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
