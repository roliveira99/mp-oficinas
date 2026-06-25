import Link from "next/link";
import { NewsDashboard } from "@/components/news/NewsDashboard";
import { NewspaperCategoryNav, NewspaperMasthead } from "@/components/news/NewspaperMasthead";
import { Icon } from "@/components/ui/Icon";
import { NewspaperClassifiedsSection } from "@/components/news/NewspaperClassifieds";
import type { ClassifiedAdRecord } from "@/lib/db/classifieds";
import type { SiteArticleRecord } from "@/lib/db/articles";

export function NewspaperHomeTop({
  articles,
  premiumClassifieds,
}: {
  articles: SiteArticleRecord[];
  premiumClassifieds: ClassifiedAdRecord[];
}) {
  if (articles.length === 0 && premiumClassifieds.length === 0) {
    return (
      <section id="jornal" className="news-feed-page border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <NewspaperMasthead compact />
          <NewspaperCategoryNav activeTab="inicio" />
          <p className="text-center text-muted">Em breve, novas manchetes no jornal.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="jornal" className="news-feed-page border-b border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <NewspaperMasthead compact />
        <NewspaperCategoryNav activeTab="inicio" />

        {articles.length > 0 && <NewsDashboard articles={articles} limit={12} />}

        <NewspaperClassifiedsSection ads={premiumClassifieds} compact />

        <div className="mt-8 flex justify-center border-t border-border pt-6">
          <Link
            href="/curiosidades#jornal-completo"
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-hover"
          >
            Ver todas as notícias
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Agrupa artigos por categoria para a página /curiosidades. */
export function groupArticlesForJournalPage(articles: SiteArticleRecord[]) {
  const lead = articles[0] ?? null;
  const rest = lead ? articles.filter((a) => a.id !== lead.id) : articles;
  const sidebar = rest.slice(0, 5);
  const secondary = rest.slice(5);
  return { lead, sidebar, secondary, all: articles };
}
