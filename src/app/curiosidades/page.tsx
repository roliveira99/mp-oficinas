import { APP_NAME } from "@/lib/brand";
import { formatCategoryLabel } from "@/lib/article-slug";
import {
  NewspaperLeadStory,
  NewspaperHeadlineGrid,
  NewspaperSecondaryGrid,
} from "@/components/news/NewspaperArticles";
import { NewspaperCategoryNav, NewspaperMasthead } from "@/components/news/NewspaperMasthead";
import { listArticles, seedArticlesIfEmpty } from "@/lib/db/articles";

export const metadata = {
  title: `Jornal — ${APP_NAME}`,
  description: "Notícias, dicas e manchetes sobre serviços, manutenção e negócios locais.",
};

export default async function CuriosidadesPage() {
  await seedArticlesIfEmpty();
  const articles = await listArticles(true);

  const [lead, ...rest] = articles;
  const sidebar = rest.slice(0, 5);
  const secondary = rest.slice(5);

  const categories = [...new Set(articles.map((a) => formatCategoryLabel(a.category)))];

  return (
    <div className="newspaper-page mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <NewspaperMasthead />
      <NewspaperCategoryNav categories={categories} />

      {articles.length === 0 ? (
        <p className="py-16 text-center text-muted">Nenhuma matéria publicada ainda.</p>
      ) : (
        <>
          <div className="grid gap-8 lg:grid-cols-3">
            {lead && <NewspaperLeadStory article={lead} />}
            <NewspaperHeadlineGrid articles={sidebar} />
          </div>
          <NewspaperSecondaryGrid articles={secondary} />
        </>
      )}
    </div>
  );
}
