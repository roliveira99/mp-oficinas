import Link from "next/link";
import { ArticleImage } from "@/components/news/ArticleImage";
import { APP_NAME } from "@/lib/brand";
import {
  articleHref,
  formatCategoryLabel,
  formatRelativeArticleTime,
} from "@/lib/article-slug";
import type { NewsTileSize } from "@/lib/news-dashboard-layout";
import type { SiteArticleRecord } from "@/lib/db/articles";

const sizeClasses: Record<NewsTileSize, string> = {
  hero: "news-tile-hero",
  medium: "news-tile-medium",
  wide: "news-tile-wide",
  small: "news-tile-small",
};

const titleClasses: Record<NewsTileSize, string> = {
  hero: "text-xl sm:text-2xl lg:text-[1.65rem]",
  medium: "text-base sm:text-lg",
  wide: "text-base sm:text-lg",
  small: "text-sm sm:text-base",
};

export function NewsTile({
  article,
  size,
  priority,
}: {
  article: SiteArticleRecord;
  size: NewsTileSize;
  priority?: boolean;
}) {
  const href = articleHref(article);
  const source = article.authorName?.trim() || APP_NAME;

  return (
    <article className={`news-tile group ${sizeClasses[size]}`}>
      <Link href={href} className="news-tile-link">
        <ArticleImage
          article={article}
          priority={priority}
          fill
          className="news-tile-image"
          sizes={
            size === "hero"
              ? "(max-width: 1024px) 100vw, 50vw"
              : "(max-width: 768px) 100vw, 25vw"
          }
        />
        <div className="news-tile-overlay" aria-hidden />
        <div className="news-tile-content">
          <div className="news-tile-meta">
            <span className="news-tile-source">{source}</span>
            <span className="news-tile-dot" aria-hidden />
            <span className="news-tile-category">{formatCategoryLabel(article.category)}</span>
            <span className="news-tile-dot" aria-hidden />
            <time dateTime={article.createdAt}>{formatRelativeArticleTime(article.createdAt)}</time>
          </div>
          <h2 className={`news-tile-title ${titleClasses[size]}`}>{article.title}</h2>
          {(size === "hero" || size === "wide") && (
            <p className="news-tile-summary">{article.summary}</p>
          )}
          <div className="news-tile-footer">
            <span className="news-tile-read">Ler matéria</span>
            {article.city && <span className="news-tile-city">{article.city}</span>}
          </div>
        </div>
      </Link>
    </article>
  );
}
