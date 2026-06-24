import Link from "next/link";
import { SiteSearchBar } from "@/components/search/SiteSearchBar";
import { APP_NAME } from "@/lib/brand";
import { formatArticleDate } from "@/lib/article-slug";
import {
  ARTICLE_CATEGORIES,
  JOURNAL_CLASSIFIEDS_HREF,
  JOURNAL_HOME_HREF,
  journalCategoryHref,
  type JournalTabId,
} from "@/lib/article-categories";

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
        <Link href={JOURNAL_HOME_HREF}>
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
        <SiteSearchBar variant="masthead" />
      </div>
      {!compact && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted sm:hidden">
          <span>{today}</span>
        </div>
      )}
    </header>
  );
}

function tabClass(active: boolean, premium = false) {
  if (premium) {
    return active
      ? "newspaper-premium-nav border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200"
      : "border-amber-500/40 bg-amber-500/10 text-amber-700 hover:border-amber-500 dark:text-amber-300";
  }
  return active
    ? "border-foreground bg-foreground text-background"
    : "border-border bg-surface text-muted hover:border-accent hover:text-accent";
}

export function NewspaperCategoryNav({
  activeTab = "inicio",
  showClassifiedsTab = true,
}: {
  activeTab?: JournalTabId;
  showClassifiedsTab?: boolean;
}) {
  return (
    <nav
      aria-label="Seções do jornal"
      className="mb-8 -mx-1 overflow-x-auto px-1 pb-1"
    >
      <div className="flex min-w-max items-center gap-2 border-b border-border pb-3">
        <Link
          href={JOURNAL_HOME_HREF}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${tabClass(activeTab === "inicio")}`}
          aria-current={activeTab === "inicio" ? "page" : undefined}
        >
          Início
        </Link>
        {ARTICLE_CATEGORIES.map((cat) => (
          <Link
            key={cat.value}
            href={journalCategoryHref(cat.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${tabClass(activeTab === cat.value)}`}
            aria-current={activeTab === cat.value ? "page" : undefined}
          >
            {cat.label}
          </Link>
        ))}
        {showClassifiedsTab && (
          <Link
            href={JOURNAL_CLASSIFIEDS_HREF}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${tabClass(activeTab === "classificados", true)}`}
            aria-current={activeTab === "classificados" ? "page" : undefined}
          >
            Classificados
          </Link>
        )}
      </div>
    </nav>
  );
}

export function NewspaperBackLink({ category }: { category?: string }) {
  const href = category ? journalCategoryHref(category) : JOURNAL_HOME_HREF;
  const label = category
    ? `← Voltar para ${ARTICLE_CATEGORIES.find((c) => c.value === category)?.label ?? category}`
    : "← Voltar ao jornal";

  return (
    <Link
      href={href}
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-accent"
    >
      {label}
    </Link>
  );
}
