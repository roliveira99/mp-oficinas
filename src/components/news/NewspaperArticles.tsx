import Image from "next/image";
import Link from "next/link";
import {
  articleHref,
  formatArticleDateShort,
  formatCategoryLabel,
} from "@/lib/article-slug";
import { ARTICLE_CATEGORIES, HOME_JOURNAL_COLUMNS, journalCategoryHref } from "@/lib/article-categories";
import type { SiteArticleRecord } from "@/lib/db/articles";
import { articlesByCategory } from "@/lib/db/articles";

function ArticleImage({
  article,
  className,
  priority,
}: {
  article: SiteArticleRecord;
  className?: string;
  priority?: boolean;
}) {
  if (article.imageUrl) {
    return (
      <Image
        src={article.imageUrl}
        alt=""
        width={1200}
        height={675}
        priority={priority}
        className={className}
      />
    );
  }
  return (
    <div
      className={`newspaper-photo-placeholder ${className ?? ""}`}
      aria-hidden
    />
  );
}

export function NewspaperLeadStory({ article }: { article: SiteArticleRecord }) {
  const href = articleHref(article);

  return (
    <article className="group lg:col-span-2">
      <Link href={href} className="block">
        <div className="overflow-hidden rounded-sm border border-border bg-surface">
          <ArticleImage
            article={article}
            priority
            className="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
          <div className="p-6 sm:p-8">
            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider text-muted">
              <span className="font-semibold text-accent">
                {formatCategoryLabel(article.category)}
              </span>
              {article.city && (
                <>
                  <span className="h-3 w-px bg-border" aria-hidden />
                  <span>{article.city}</span>
                </>
              )}
              <span className="h-3 w-px bg-border" aria-hidden />
              <time dateTime={article.createdAt}>{formatArticleDateShort(article.createdAt)}</time>
            </div>
            <h2 className="newspaper-headline text-2xl font-bold leading-tight text-foreground transition group-hover:text-accent sm:text-3xl lg:text-4xl">
              {article.title}
            </h2>
            <p className="newspaper-deck mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {article.summary}
            </p>
            <span className="mt-5 inline-flex items-center text-sm font-semibold text-accent">
              Ler matéria completa →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function NewspaperHeadlineItem({
  article,
  index,
}: {
  article: SiteArticleRecord;
  index: number;
}) {
  const href = articleHref(article);

  return (
    <article className="group border-b border-border py-4 last:border-b-0">
      <Link href={href} className="grid gap-3 sm:grid-cols-[4.5rem_1fr]">
        <span className="font-serif text-3xl font-light leading-none text-border-strong tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-muted">
            <span className="font-semibold text-accent">
              {formatCategoryLabel(article.category)}
            </span>
            {article.city && <span>{article.city}</span>}
            <time dateTime={article.createdAt}>{formatArticleDateShort(article.createdAt)}</time>
          </div>
          <h3 className="text-base font-semibold leading-snug text-foreground transition group-hover:text-accent sm:text-lg">
            {article.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{article.summary}</p>
        </div>
      </Link>
    </article>
  );
}

export function NewspaperHeadlineGrid({
  articles,
  title = "Outras manchetes",
}: {
  articles: SiteArticleRecord[];
  title?: string;
}) {
  if (articles.length === 0) return null;

  return (
    <aside className="rounded-sm border border-border bg-surface p-5 sm:p-6">
      <h2 className="mb-4 border-b border-border pb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted">
        {title}
      </h2>
      <div>
        {articles.map((article, i) => (
          <NewspaperHeadlineItem key={article.id} article={article} index={i} />
        ))}
      </div>
    </aside>
  );
}

export function NewspaperSecondaryGrid({ articles }: { articles: SiteArticleRecord[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-10 border-t-2 border-foreground pt-8">
      <h2 className="mb-6 text-xs font-bold uppercase tracking-[0.25em] text-muted">
        Mais notícias
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => {
          const href = articleHref(article);
          return (
            <article key={article.id} className="group">
              <Link href={href} className="block overflow-hidden rounded-sm border border-border bg-surface">
                <ArticleImage
                  article={article}
                  className="aspect-[3/2] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
                <div className="p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                    {formatCategoryLabel(article.category)}
                  </span>
                  <h3 className="mt-2 text-base font-semibold leading-snug text-foreground group-hover:text-accent">
                    {article.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{article.summary}</p>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function NewspaperCategoryColumns({
  articles,
  excludeId,
  limit = 3,
}: {
  articles: SiteArticleRecord[];
  excludeId?: string;
  limit?: number;
}) {
  const columns = HOME_JOURNAL_COLUMNS.map((catValue) => {
    const def = ARTICLE_CATEGORIES.find((c) => c.value === catValue);
    const items = articlesByCategory(articles, catValue, excludeId, limit);
    return { def, items };
  }).filter((col) => col.items.length > 0);

  if (columns.length === 0) return null;

  return (
    <section className="mt-10 border-t-2 border-foreground pt-8">
      <h2 className="mb-6 text-xs font-bold uppercase tracking-[0.25em] text-muted">
        Por editoria
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {columns.map(({ def, items }) => (
          <div key={def?.value} className="border border-border bg-surface p-4 sm:p-5">
            <h3 className="border-b-2 border-accent pb-2 text-sm font-bold uppercase tracking-wider text-foreground">
              {def?.label ?? def?.value}
            </h3>
            <ul className="mt-3 divide-y divide-border">
              {items.map((article) => (
                <li key={article.id} className="py-3 first:pt-0 last:pb-0">
                  <Link href={articleHref(article)} className="group block">
                    {article.imageUrl && (
                      <div className="mb-2 overflow-hidden rounded-sm">
                        <ArticleImage
                          article={article}
                          className="aspect-[16/10] w-full object-cover transition group-hover:scale-[1.02]"
                        />
                      </div>
                    )}
                    {article.city && (
                      <span className="text-[10px] font-medium uppercase text-muted">{article.city}</span>
                    )}
                    <span className="mt-0.5 block text-sm font-semibold leading-snug text-foreground group-hover:text-accent">
                      {article.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {def && (
              <Link
                href={journalCategoryHref(def.value)}
                className="mt-3 inline-block text-xs font-semibold text-accent hover:underline"
              >
                Mais em {def.label} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function NewspaperCategorySections({
  articles,
}: {
  articles: SiteArticleRecord[];
}) {
  const grouped = ARTICLE_CATEGORIES.map((cat) => ({
    cat,
    items: articles.filter((a) => a.category === cat.value),
  })).filter((g) => g.items.length > 0);

  if (grouped.length === 0) return null;

  return (
    <div className="mt-12 space-y-12">
      {grouped.map(({ cat, items }) => (
        <section key={cat.value} id={`secao-${cat.value}`} className="scroll-mt-24">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b-2 border-foreground pb-3">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wide text-foreground">{cat.label}</h2>
              <p className="mt-1 text-sm text-muted">{cat.description}</p>
            </div>
            <span className="text-xs text-muted">{items.length} matéria{items.length > 1 ? "s" : ""}</span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((article) => {
              const href = articleHref(article);
              return (
                <article key={article.id} className="group">
                  <Link href={href} className="block overflow-hidden rounded-sm border border-border bg-surface">
                    <ArticleImage
                      article={article}
                      className="aspect-[3/2] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="p-4">
                      {article.city && (
                        <span className="text-[10px] font-medium uppercase text-muted">{article.city}</span>
                      )}
                      <h3 className="mt-1 text-base font-semibold leading-snug text-foreground group-hover:text-accent">
                        {article.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted">{article.summary}</p>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function NewspaperHomePreview({
  lead,
  headlines,
}: {
  lead: SiteArticleRecord;
  headlines: SiteArticleRecord[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <NewspaperLeadStory article={lead} />
      </div>
      <NewspaperHeadlineGrid articles={headlines} />
    </div>
  );
}
