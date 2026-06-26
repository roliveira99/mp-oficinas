"use client";

import { MediaPreview } from "@/components/ui/MediaPreview";

interface WorkshopProfileVideosProps {
  videos: string[];
  workshopName: string;
}

export function WorkshopProfileVideos({ videos, workshopName }: WorkshopProfileVideosProps) {
  if (videos.length === 0) return null;

  return (
    <section id="videos" className="scroll-mt-24 mt-12">
      <h2 className="text-2xl font-semibold tracking-tight">Vídeos</h2>
      <p className="mt-1 text-sm text-muted">Conheça {workshopName} em vídeo.</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {videos.map((url, index) => (
          <div key={`${index}-${url.slice(0, 24)}`} className="overflow-hidden rounded-xl border border-border">
            <MediaPreview
              src={url}
              alt={`Vídeo de ${workshopName}`}
              videoClassName="aspect-video w-full"
              className="aspect-video w-full object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
