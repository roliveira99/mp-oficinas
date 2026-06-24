import Link from "next/link";
import {
  articleHref,
  formatArticleDate,
  formatArticleDateShort,
  formatCategoryLabel,
} from "@/lib/article-slug";
import type { SiteArticleRecord } from "@/lib/db/articles";
import { NewspaperBackLink } from "@/components/news/NewspaperMasthead";

function ArticleParagraphs({ content }: { content: string }) {
  const paragraphs = content.split(/\n\n+/).filter(Boolean);
  return (
    <div className="newspaper-body space-y-5">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-base leading-[1.85] text-foreground sm:text-lg">
          {p}
        </p>
      ))}
    </div>
  );
}

export function NewspaperArticlePage({
  article,
  related,
}: {
  article: SiteArticleRecord;
  related: SiteArticleRecord[];
}) {
  return (
    <article className="mx-auto max-w-3xl">
      <NewspaperBackLink category={article.category} />

      <header className="border-b border-border pb-8">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider text-muted">
          <span className="rounded-sm bg-accent-soft px-2 py-0.5 font-semibold text-accent">
            {formatCategoryLabel(article.category)}
          </span>
          {article.city && <span>{article.city}</span>}
          <time dateTime={article.createdAt}>{formatArticleDate(article.createdAt)}</time>
        </div>
        <h1 className="newspaper-headline text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
          {article.title}
        </h1>
        <p className="newspaper-deck mt-5 text-lg leading-relaxed text-muted-foreground sm:text-xl">
          {article.summary}
        </p>
      </header>

      {article.imageUrl && (
        <figure className="my-8 overflow-hidden rounded-sm border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.imageUrl}
            alt=""
            className="aspect-[16/9] w-full object-cover"
          />
        </figure>
      )}

      <div className="py-8">
        <ArticleParagraphs content={article.content} />
      </div>

      {related.length > 0 && (
        <aside className="mt-10 border-t-2 border-foreground pt-8">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-muted">
            Leia também
          </h2>
          <ul className="divide-y divide-border">
            {related.map((r) => (
              <li key={r.id} className="py-3">
                <Link
                  href={articleHref(r)}
                  className="group block"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                    {formatCategoryLabel(r.category)}
                  </span>
                  <span className="mt-1 block text-base font-semibold text-foreground group-hover:text-accent">
                    {r.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {formatArticleDateShort(r.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}
