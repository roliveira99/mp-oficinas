"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { APP_NAME } from "@/lib/brand";
import { directoryUrl } from "@/lib/platform-routes";
import { PLATFORM_CITIES } from "@/lib/cities";
import { getVerticalConfig, VERTICAL_LIST } from "@/lib/verticals/config";
import { workshopTypeLabels } from "@/lib/labels";
import type { BusinessVertical } from "@/types/vertical";
import type { WorkshopType } from "@/types/workshop";

const popularCities = PLATFORM_CITIES.slice(0, 5);

export function PublicHomeHero({ selectedCity }: { selectedCity?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<BusinessVertical | "">("");
  const [subFilter, setSubFilter] = useState("");

  const segmentConfig = segment ? getVerticalConfig(segment) : null;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params: {
      q?: string;
      segmento?: BusinessVertical;
      tipo?: string;
      categoria?: string;
      cidade?: string;
    } = {};
    if (query.trim()) params.q = query.trim();
    if (segment) params.segmento = segment;
    if (subFilter) {
      if (segmentConfig?.usesAutomotiveTypes) params.tipo = subFilter;
      else params.categoria = subFilter;
    }
    if (selectedCity) params.cidade = selectedCity;
    router.push(directoryUrl(params));
  }

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 dark:opacity-10"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-surface/95 to-surface" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-eyebrow mb-4">Sem cadastro · Contato direto · Avaliações reais</p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Encontre o negócio ideal perto de você
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Oficinas, lojas, salões, restaurantes e milhares de empreendimentos — compare perfis e fale direto pelo {APP_NAME}.
          </p>

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-2xl border border-border bg-surface/90 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:p-2"
          >
            <div className="relative flex-1">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cidade, bairro ou nome do negócio..."
                className="input-field w-full !border-0 !bg-transparent !pl-10 !shadow-none"
              />
            </div>
            <select
              value={segment}
              onChange={(e) => {
                setSegment(e.target.value as BusinessVertical | "");
                setSubFilter("");
              }}
              className="input-field sm:max-w-[180px]"
            >
              <option value="">Todos os segmentos</option>
              {VERTICAL_LIST.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            {segmentConfig && (
              <select
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value)}
                className="input-field sm:max-w-[180px]"
              >
                <option value="">Todos os tipos</option>
                {segmentConfig.usesAutomotiveTypes
                  ? (Object.entries(workshopTypeLabels) as [WorkshopType, string][]).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))
                  : segmentConfig.categories.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
              </select>
            )}
            <button
              type="submit"
              className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
            >
              Buscar
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-muted">Segmentos:</span>
            {VERTICAL_LIST.slice(0, 6).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => router.push(directoryUrl({ segmento: v.id }))}
                className="rounded-full border border-border bg-surface px-3 py-1 text-muted-foreground transition hover:border-accent hover:text-accent"
              >
                {v.defaultEmoji} {v.name}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-muted">Cidades:</span>
            {popularCities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => router.push(directoryUrl({ cidade: city }))}
                className="rounded-full border border-border bg-surface px-3 py-1 text-muted-foreground transition hover:border-accent hover:text-accent"
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
