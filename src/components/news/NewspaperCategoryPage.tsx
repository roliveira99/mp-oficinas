import { NewsDashboard } from "@/components/news/NewsDashboard";
import type { ArticleCategoryDef } from "@/lib/article-categories";
import type { SiteArticleRecord } from "@/lib/db/articles";

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

  return (
    <div>
      <header className="news-category-header mb-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {category.label}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">{category.description}</p>
        <p className="mt-2 text-xs text-muted">
          {articles.length} matéria{articles.length > 1 ? "s" : ""} nesta editoria
        </p>
      </header>

      <NewsDashboard articles={articles} showSidebar={articles.length > 4} />
    </div>
  );
}
