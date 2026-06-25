import { APP_NAME } from "@/lib/brand";
import { NewsDashboard, NewsFeedToolbar } from "@/components/news/NewsDashboard";
import { NewspaperClassifiedsSection } from "@/components/news/NewspaperClassifieds";
import { NewspaperCategoryNav, NewspaperMasthead } from "@/components/news/NewspaperMasthead";
import { listPremiumClassifieds } from "@/lib/db/classifieds";
import { listArticles, seedArticlesIfEmpty } from "@/lib/db/articles";

export const metadata = {
  title: `Jornal — ${APP_NAME}`,
  description: "Capa do jornal: notícias de cidade, esporte, negócios, cultura e classificados premium.",
};

export default async function CuriosidadesPage() {
  await seedArticlesIfEmpty();
  const [articles, premiumClassifieds] = await Promise.all([
    listArticles(true),
    listPremiumClassifieds(4),
  ]);

  return (
    <div id="jornal-completo" className="news-feed-page newspaper-page mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <NewspaperMasthead />
      <NewspaperCategoryNav activeTab="inicio" />
      <NewsFeedToolbar />

      {articles.length === 0 && premiumClassifieds.length === 0 ? (
        <p className="py-16 text-center text-muted">Nenhuma matéria publicada ainda.</p>
      ) : (
        <>
          {articles.length > 0 && <NewsDashboard articles={articles} />}
          <NewspaperClassifiedsSection ads={premiumClassifieds} compact />
        </>
      )}
    </div>
  );
}
