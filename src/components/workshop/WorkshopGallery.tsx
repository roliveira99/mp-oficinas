"use client";

import { useState } from "react";
import { MediaPreview } from "@/components/ui/MediaPreview";
import { isDataVideoUrl } from "@/lib/media-url";
import type { WorkshopGalleryItem } from "@/types/workshop";

const kindLabels: Record<WorkshopGalleryItem["kind"], string> = {
  ambiente: "Ambiente",
  antes: "Antes",
  depois: "Depois",
  equipe: "Equipe",
};

function isGalleryVideo(item: WorkshopGalleryItem): boolean {
  return item.mediaType === "video" || isDataVideoUrl(item.url);
}

interface WorkshopGalleryProps {
  items: WorkshopGalleryItem[];
  workshopName: string;
}

export function WorkshopGallery({ items, workshopName }: WorkshopGalleryProps) {
  const [active, setActive] = useState(0);
  if (items.length === 0) return null;

  const current = items[active] ?? items[0];
  const currentIsVideo = isGalleryVideo(current);

  return (
    <section id="galeria" className="scroll-mt-24 mt-12">
      <h2 className="text-2xl font-semibold tracking-tight">Galeria</h2>
      <p className="mt-1 text-sm text-muted">Fotos e vídeos do negócio.</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div
          className={`relative overflow-hidden rounded-xl lg:col-span-2 ${
            currentIsVideo ? "aspect-video" : "aspect-[4/3] lg:aspect-auto lg:min-h-[320px]"
          }`}
        >
          <MediaPreview
            src={current.url}
            alt={`${workshopName} — ${current.caption}`}
            className="h-full w-full object-cover"
            videoClassName="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
              {kindLabels[current.kind]}
            </span>
            <p className="mt-1 text-sm font-medium text-white">{current.caption}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-3">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(index)}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                active === index ? "border-accent" : "border-transparent opacity-80 hover:opacity-100"
              }`}
            >
              <MediaPreview
                src={item.url}
                alt={item.caption}
                className="h-full w-full object-cover"
                videoClassName="h-full w-full object-cover"
                controls={false}
              />
              {isGalleryVideo(item) && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 text-xs font-semibold text-white">
                  ▶
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
