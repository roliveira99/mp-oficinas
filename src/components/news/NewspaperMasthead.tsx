import Link from "next/link";
import { APP_NAME } from "@/lib/brand";
import { formatArticleDate } from "@/lib/article-slug";
import { ARTICLE_CATEGORIES } from "@/lib/article-categories";

export function NewspaperMasthead({ compact = false }: { compact?: boolean }) {
  const today = formatArticleDate(new Date().toISOString());

  return (
    <header className={`newspaper-masthead text-center ${compact ? "mb-6" : "mb-8"}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 text-xs uppercase tracking-widest text-muted">
        <span>Edição digital</span>
        <span className="hidden sm:inline">{today}</span>
        <span>Brasil</span>
      </div>
      <div className="border-y-2 border-foreground py-3 sm:py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted sm:text-xs">
          Jornal
        </p>
        <Link href="/curiosidades">
          <h1
            className={`newspaper-title mt-1 font-bold tracking-tight text-foreground transition hover:text-accent ${
              compact ? "text-3xl sm:text-4xl lg:text-5xl" : "text-4xl sm:text-5xl lg:text-6xl"
            }`}
          >
            {APP_NAME}
          </h1>
        </Link>
        <p className={`mt-2 text-muted ${compact ? "text-sm" : "text-sm sm:text-base"}`}>
          Cidade, esporte, negócios, cultura e notícias da sua região
        </p>
      </div>
      {!compact && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted sm:hidden">
          <span>{today}</span>
        </div>
      )}
    </header>
  );
}

export function NewspaperCategoryNav({
  activeCategories,
}: {
  activeCategories: string[];
}) {
  const items = ARTICLE_CATEGORIES.filter((c) => activeCategories.includes(c.value));
  const showClassifieds = activeCategories.includes("classificados");

  if (items.length === 0 && !showClassifieds) return null;

  return (
    <nav
      aria-label="Seções do jornal"
      className="mb-8 flex flex-wrap items-center justify-center gap-2 border-b border-border pb-4"
    >
      {items.map((cat) => (
        <a
          key={cat.value}
          href={`#secao-${cat.value}`}
          className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted transition hover:border-accent hover:text-accent"
        >
          {cat.label}
        </a>
      ))}
      {showClassifieds && (
        <a
          href="#secao-classificados"
          className="newspaper-premium-nav rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-amber-700 transition hover:border-amber-500 dark:text-amber-300"
        >
          Classificados premium
        </a>
      )}
    </nav>
  );
}

export function NewspaperBackLink() {
  return (
    <Link
      href="/curiosidades"
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-accent"
    >
      ← Voltar ao jornal
    </Link>
  );
}
