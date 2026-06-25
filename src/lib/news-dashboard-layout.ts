import type { SiteArticleRecord } from "@/lib/db/articles";

export type NewsTileSize = "hero" | "medium" | "small" | "wide";

export interface NewsTilePlacement {
  article: SiteArticleRecord;
  size: NewsTileSize;
}

/** Distribui matérias em um mosaico estilo feed (hero + tiles variados). */
export function planNewsDashboardLayout(articles: SiteArticleRecord[]): NewsTilePlacement[] {
  if (articles.length === 0) return [];

  const placements: NewsTilePlacement[] = [{ article: articles[0], size: "hero" }];

  for (let i = 1; i < articles.length; i++) {
    const mod = i % 6;
    if (mod === 1 || mod === 2) placements.push({ article: articles[i], size: "medium" });
    else if (mod === 5) placements.push({ article: articles[i], size: "wide" });
    else placements.push({ article: articles[i], size: "small" });
  }

  return placements;
}
