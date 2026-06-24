import Link from "next/link";
import {
  NewspaperLeadStory,
  NewspaperHeadlineGrid,
  NewspaperCategoryColumns,
} from "@/components/news/NewspaperArticles";
import { NewspaperMasthead } from "@/components/news/NewspaperMasthead";
import { Icon } from "@/components/ui/Icon";
import { NewspaperClassifiedsSection } from "@/components/news/NewspaperClassifieds";
import type { ClassifiedAdRecord } from "@/lib/db/classifieds";
import { pickLeadArticle, type SiteArticleRecord } from "@/lib/db/articles";

export function NewspaperHomeTop({
  articles,
  premiumClassifieds,
}: {
  articles: SiteArticleRecord[];
  premiumClassifieds: ClassifiedAdRecord[];
}) {
  const lead = pickLeadArticle(articles);
  const headlines = articles.filter((a) => a.id !== lead?.id).slice(0, 5);

  if (!lead) {
    return (
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <NewspaperMasthead compact />
          {articles.length === 0 && premiumClassifieds.length === 0 ? (
            <p className="text-center text-muted">Em breve, novas manchetes no jornal.</p>
          ) : null}
          <NewspaperClassifiedsSection ads={premiumClassifieds} compact />
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <NewspaperMasthead compact />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <NewspaperLeadStory article={lead} />
          </div>
          <NewspaperHeadlineGrid articles={headlines} title="Últimas manchetes" />
        </div>

        <NewspaperCategoryColumns articles={articles} excludeId={lead.id} />

        <NewspaperClassifiedsSection ads={premiumClassifieds} compact />

        <div className="mt-8 flex justify-center border-t border-border pt-6">
          <Link
            href="/curiosidades"
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-hover"
          >
            Ver jornal completo — todas as seções
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Agrupa artigos por categoria para a página /curiosidades. */
export function groupArticlesForJournalPage(articles: SiteArticleRecord[]) {
  const lead = pickLeadArticle(articles);
  const rest = articles.filter((a) => a.id !== lead?.id);
  const sidebar = rest.slice(0, 5);
  const secondary = rest.slice(5);
  return { lead, sidebar, secondary, all: articles };
}
