import {
  NewspaperHeadlineGrid,
  NewspaperLeadStory,
  NewspaperSecondaryGrid,
} from "@/components/news/NewspaperArticles";
import type { ArticleCategoryDef } from "@/lib/article-categories";
import type { SiteArticleRecord } from "@/lib/db/articles";
import { pickLeadArticle } from "@/lib/db/articles";

export function NewspaperCategoryPage({
  category,
  articles,
}: {
  category: ArticleCategoryDef;
  articles: SiteArticleRecord[];
}) {
  if (articles.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">Nenhuma matéria publicada em {category.label} ainda.</p>
      </div>
    );
  }

  const lead = pickLeadArticle(articles);
  const rest = articles.filter((a) => a.id !== lead?.id);
  const sidebar = rest.slice(0, 5);
  const secondary = rest.slice(5);

  return (
    <div>
      <header className="mb-8 border-b-2 border-foreground pb-4">
        <h2 className="text-2xl font-bold uppercase tracking-wide text-foreground sm:text-3xl">
          {category.label}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">{category.description}</p>
        <p className="mt-2 text-xs text-muted">
          {articles.length} matéria{articles.length > 1 ? "s" : ""} nesta editoria
        </p>
      </header>

      {lead && (
        <div className="grid gap-8 lg:grid-cols-3">
          <NewspaperLeadStory article={lead} />
          {sidebar.length > 0 && (
            <NewspaperHeadlineGrid articles={sidebar} title={`Mais em ${category.label}`} />
          )}
        </div>
      )}

      {secondary.length > 0 && <NewspaperSecondaryGrid articles={secondary} />}
    </div>
  );
}
