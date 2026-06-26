"use client";

import type { Workshop, WorkshopCatalog } from "@/types/workshop";
import { formatCatalogPrice } from "@/lib/workshop-storage";
import { PRICE_DISCLAIMER } from "@/lib/workshop-profile";
import { MediaPreview } from "@/components/ui/MediaPreview";
import { Icon } from "@/components/ui/Icon";

interface WorkshopCatalogSectionProps {
  workshop: Workshop;
}

export function WorkshopCatalogSection({ workshop }: WorkshopCatalogSectionProps) {
  const catalog: WorkshopCatalog = workshop.catalog;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight">Catálogo de serviços e peças</h2>
      <p className="mt-2 text-sm text-muted">{PRICE_DISCLAIMER}</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <CatalogList title="Serviços" items={catalog.services} />
        <CatalogList title="Peças e produtos" items={catalog.parts} />
      </div>
    </section>
  );
}

function CatalogList({
  title,
  items,
}: {
  title: string;
  items: WorkshopCatalog["services"];
}) {
  if (items.length === 0) {
    return (
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h3>
        <p className="text-sm text-muted">Nenhum item cadastrado no momento.</p>
      </div>
    );
  }

  const hasMedia = items.some((item) => item.imageUrl || item.videoUrl);

  if (hasMedia) {
    return (
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="overflow-hidden rounded-xl border border-border bg-surface"
            >
              {item.videoUrl ? (
                <MediaPreview
                  src={item.videoUrl}
                  videoClassName="aspect-[4/3] w-full object-cover"
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-surface-hover text-xs text-muted">
                  Sem mídia
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                {item.description && (
                  <p className="mt-0.5 text-xs text-muted">{item.description}</p>
                )}
                <p className="mt-2 text-sm font-semibold text-accent">
                  a partir de {formatCatalogPrice(item.priceFrom)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{item.name}</p>
              {item.description && (
                <p className="mt-0.5 text-xs text-muted">{item.description}</p>
              )}
            </div>
            <p className="shrink-0 text-sm font-semibold text-accent">
              a partir de {formatCatalogPrice(item.priceFrom)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WorkshopPaymentMethods({ methods }: { methods: string[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight">Formas de pagamento</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {methods.map((method) => (
          <span
            key={method}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-hover px-3 py-1.5 text-sm text-muted-foreground"
          >
            <Icon name="credit-card" className="h-4 w-4 text-accent" />
            {method}
          </span>
        ))}
      </div>
    </section>
  );
}

export function WorkshopMechanicRanking({
  ranking,
  workshopType,
}: {
  ranking: NonNullable<Workshop["mechanicRanking"]>;
  workshopType: Workshop["type"];
}) {
  const title = workshopType === "estetica" ? "Equipe em destaque" : "Ranking de mecânicos";

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <ul className="mt-4 space-y-3">
        {ranking.map((entry, index) => (
          <li
            key={entry.name}
            className="flex items-center gap-4 rounded-lg border border-border bg-surface-hover/40 px-4 py-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{entry.name}</p>
              {entry.specialty && (
                <p className="text-xs text-muted">{entry.specialty}</p>
              )}
            </div>
            <div className="text-right text-sm">
              <div className="flex items-center justify-end gap-1 font-semibold">
                <Icon name="star" className="h-4 w-4 text-amber-500" />
                {entry.rating.toFixed(1)}
              </div>
              <p className="text-xs text-muted">{entry.servicesCompleted} serviços</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
