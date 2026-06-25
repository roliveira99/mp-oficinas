import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { NewsTile } from "@/components/news/NewsTile";
import {
  ARTICLE_CATEGORIES,
  journalCategoryHref,
} from "@/lib/article-categories";
import { articleHref } from "@/lib/article-slug";
import { planNewsDashboardLayout } from "@/lib/news-dashboard-layout";
import type { SiteArticleRecord } from "@/lib/db/articles";

function NewsTrendingWidget({ articles }: { articles: SiteArticleRecord[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="news-widget" aria-labelledby="news-trending-heading">
      <h2 id="news-trending-heading" className="news-widget-title">
        Em alta
      </h2>
      <ol className="news-trending-list">
        {articles.map((article, index) => (
          <li key={article.id}>
            <Link href={articleHref(article)} className="news-trending-item">
              <span className="news-trending-rank" aria-hidden>
                {index + 1}
              </span>
              <span className="news-trending-headline">{article.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function NewsEditoriasWidget() {
  return (
    <section className="news-widget" aria-labelledby="news-editorias-heading">
      <h2 id="news-editorias-heading" className="news-widget-title">
        Editorias
      </h2>
      <ul className="news-editorias-list">
        {ARTICLE_CATEGORIES.map((cat) => (
          <li key={cat.value}>
            <Link href={journalCategoryHref(cat.value)} className="news-editoria-item">
              <span className="news-editoria-label">{cat.label}</span>
              <Icon name="plus" className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NewsDashboard({
  articles,
  showSidebar = true,
  limit,
}: {
  articles: SiteArticleRecord[];
  showSidebar?: boolean;
  limit?: number;
}) {
  const displayArticles = limit ? articles.slice(0, limit) : articles;
  const placements = planNewsDashboardLayout(displayArticles);

  if (placements.length === 0) return null;

  return (
    <div className={`news-dashboard ${showSidebar ? "news-dashboard-with-sidebar" : ""}`}>
      <div className="news-dashboard-main">
        <div className="news-dashboard-grid">
          {placements.map((placement, index) => (
            <NewsTile
              key={placement.article.id}
              article={placement.article}
              size={placement.size}
              priority={index === 0}
            />
          ))}
        </div>
      </div>
      {showSidebar && (
        <aside className="news-dashboard-sidebar" aria-label="Destaques laterais">
          <NewsTrendingWidget articles={articles.slice(0, 8)} />
          <NewsEditoriasWidget />
        </aside>
      )}
    </div>
  );
}

export function NewsFeedToolbar() {
  return (
    <div className="news-feed-toolbar">
      <Link href="/curiosidades" className="news-feed-refresh">
        <Icon name="refresh" className="h-4 w-4" aria-hidden />
        Atualizar histórias
      </Link>
    </div>
  );
}
