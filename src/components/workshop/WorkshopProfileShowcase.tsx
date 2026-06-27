"use client";

import { MediaPreview } from "@/components/ui/MediaPreview";
import { getShowcaseDisplayLabel } from "@/lib/showcase-format";
import type { WorkshopShowcaseItem } from "@/types/workshop";

export function WorkshopProfileShowcase({
  items,
  workshopName,
}: {
  items: WorkshopShowcaseItem[];
  workshopName: string;
}) {
  if (items.length === 0) return null;

  return (
    <section id="vitrine" className="scroll-mt-24 mt-12">
      <h2 className="text-2xl font-semibold tracking-tight">Vitrine</h2>
      <p className="mt-1 text-sm text-muted">
        Produtos e novidades de {workshopName} — confira fotos, vídeos e valores.
      </p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const displayLabel = getShowcaseDisplayLabel(item);

          return (
            <li
              key={item.id}
              className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
            >
              <div className="relative">
                <MediaPreview
                  src={item.url}
                  alt={item.title ?? "Produto em destaque"}
                  className="aspect-[3/4] w-full object-cover"
                  videoClassName="aspect-[3/4] w-full object-cover"
                />
                {displayLabel && (
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-sm font-semibold text-white backdrop-blur">
                    {displayLabel}
                  </span>
                )}
              </div>
              {(item.title?.trim() || item.label?.trim()) && (
                <div className="border-t border-border px-3 py-2.5">
                  {item.title?.trim() && (
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                  )}
                  {item.price != null && item.price > 0 && item.label?.trim() && (
                    <p className="mt-0.5 text-xs text-muted">{item.label}</p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
