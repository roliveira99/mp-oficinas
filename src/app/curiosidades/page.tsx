import { APP_NAME } from "@/lib/brand";
import {
  NewspaperLeadStory,
  NewspaperHeadlineGrid,
  NewspaperCategoryColumns,
} from "@/components/news/NewspaperArticles";
import { NewspaperClassifiedsSection } from "@/components/news/NewspaperClassifieds";
import { NewspaperCategoryNav, NewspaperMasthead } from "@/components/news/NewspaperMasthead";
import { groupArticlesForJournalPage } from "@/components/news/NewspaperHomeTop";
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
  const { lead, sidebar } = groupArticlesForJournalPage(articles);

  return (
    <div id="jornal-completo" className="newspaper-page mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <NewspaperMasthead />
      <NewspaperCategoryNav activeTab="inicio" />

      {articles.length === 0 && premiumClassifieds.length === 0 ? (
        <p className="py-16 text-center text-muted">Nenhuma matéria publicada ainda.</p>
      ) : (
        <>
          {lead && (
            <div className="grid gap-8 lg:grid-cols-3">
              <NewspaperLeadStory article={lead} />
              <NewspaperHeadlineGrid articles={sidebar} />
            </div>
          )}
          <NewspaperCategoryColumns articles={articles} excludeId={lead?.id} />
          <NewspaperClassifiedsSection ads={premiumClassifieds} compact />
        </>
      )}
    </div>
  );
}
