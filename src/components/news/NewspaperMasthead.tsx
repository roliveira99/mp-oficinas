import Link from "next/link";
import { APP_NAME } from "@/lib/brand";
import { formatArticleDate } from "@/lib/article-slug";

export function NewspaperMasthead() {
  const today = formatArticleDate(new Date().toISOString());

  return (
    <header className="newspaper-masthead mb-8 text-center">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 text-xs uppercase tracking-widest text-muted">
        <span>Edição digital</span>
        <span className="hidden sm:inline">{today}</span>
        <span>Brasil</span>
      </div>
      <div className="border-y-2 border-foreground py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted sm:text-xs">
          Jornal
        </p>
        <h1 className="newspaper-title mt-1 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {APP_NAME}
        </h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          Notícias, dicas e informações para quem busca serviços com confiança
        </p>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted sm:hidden">
        <span>{today}</span>
      </div>
    </header>
  );
}

export function NewspaperCategoryNav({ categories }: { categories: string[] }) {
  if (categories.length <= 1) return null;
  return (
    <nav
      aria-label="Seções do jornal"
      className="mb-8 flex flex-wrap items-center justify-center gap-2 border-b border-border pb-4"
    >
      {categories.map((cat) => (
        <a
          key={cat}
          href={`#secao-${cat}`}
          className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted transition hover:border-accent hover:text-accent"
        >
          {cat}
        </a>
      ))}
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
