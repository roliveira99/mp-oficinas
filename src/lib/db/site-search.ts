import { listArticles, type SiteArticleRecord } from "@/lib/db/articles";
import { listWorkshops } from "@/lib/db/workshops";
import type { Workshop } from "@/types/workshop";

function matchesQuery(text: string | null | undefined, q: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(q);
}

export interface SiteSearchResult {
  query: string;
  articles: SiteArticleRecord[];
  workshops: Workshop[];
}

export async function searchSite(rawQuery: string): Promise<SiteSearchResult> {
  const query = rawQuery.trim();
  const q = query.toLowerCase();

  if (q.length < 2) {
    return { query, articles: [], workshops: [] };
  }

  const [articles, workshops] = await Promise.all([listArticles(true), listWorkshops()]);

  const matchedArticles = articles
    .filter(
      (a) =>
        matchesQuery(a.title, q) ||
        matchesQuery(a.summary, q) ||
        matchesQuery(a.city, q) ||
        matchesQuery(a.category, q)
    )
    .slice(0, 12);

  const matchedWorkshops = workshops
    .filter(
      (w) =>
        matchesQuery(w.name, q) ||
        matchesQuery(w.city, q) ||
        matchesQuery(w.description, q) ||
        matchesQuery(w.address, q)
    )
    .slice(0, 12);

  return { query, articles: matchedArticles, workshops: matchedWorkshops };
}
