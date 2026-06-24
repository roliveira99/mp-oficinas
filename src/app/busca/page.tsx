import Link from "next/link";
import { WorkshopCard } from "@/components/workshop/WorkshopCard";
import { SiteSearchBar } from "@/components/search/SiteSearchBar";
import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { articleHref, formatArticleDateShort, formatCategoryLabel } from "@/lib/article-slug";
import { searchSite } from "@/lib/db/site-search";
import { getPlatformTerminology } from "@/lib/platform-routes";
import { APP_NAME } from "@/lib/brand";

export const metadata = {
  title: `Busca — ${APP_NAME}`,
  description: "Pesquise notícias e negócios na plataforma.",
};

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const result = q.trim().length >= 2 ? await searchSite(q) : null;
  const terms = getPlatformTerminology();
  const total = result ? result.articles.length + result.workshops.length : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Pesquisa"
        title="Encontre notícias e negócios"
        description="Digite o nome de uma matéria, cidade, categoria ou estabelecimento."
      />

      <div className="mb-10 flex justify-center px-2">
        <SiteSearchBar variant="masthead" initialQuery={q} className="!max-w-3xl" />
      </div>

      {!q.trim() && (
        <p className="text-center text-sm text-muted">
          Use a lupa no topo do site a qualquer momento para pesquisar.
        </p>
      )}

      {q.trim() && q.trim().length < 2 && (
        <p className="text-center text-sm text-muted">Digite pelo menos 2 caracteres para buscar.</p>
      )}

      {result && (
        <>
          <p className="mb-8 text-center text-sm text-muted">
            {total === 0
              ? `Nenhum resultado para “${result.query}”.`
              : `${total} resultado${total === 1 ? "" : "s"} para “${result.query}”.`}
          </p>

          {result.articles.length > 0 && (
            <section className="mb-12">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Notícias</h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {result.articles.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={articleHref(article)}
                      className="card block h-full p-5 transition hover:shadow-md"
                    >
                      <span className="mb-2 inline-flex rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                        {formatCategoryLabel(article.category)}
                      </span>
                      <h3 className="font-semibold leading-snug text-foreground">{article.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted">{article.summary}</p>
                      <p className="mt-3 text-xs text-muted">
                        {formatArticleDateShort(article.createdAt)}
                        {article.city ? ` · ${article.city}` : ""}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.workshops.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-foreground">Negócios</h2>
                <Link
                  href={terms.directoryPath}
                  className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-hover"
                >
                  Ver diretório
                  <Icon name="arrow-right" className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {result.workshops.map((workshop) => (
                  <WorkshopCard key={workshop.id} workshop={workshop} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
