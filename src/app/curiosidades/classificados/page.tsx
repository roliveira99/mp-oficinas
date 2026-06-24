import { APP_NAME } from "@/lib/brand";
import { NewspaperClassifiedsSection } from "@/components/news/NewspaperClassifieds";
import { NewspaperCategoryNav, NewspaperMasthead } from "@/components/news/NewspaperMasthead";
import { listPremiumClassifieds } from "@/lib/db/classifieds";

export const metadata = {
  title: `Classificados premium — Jornal ${APP_NAME}`,
  description: "Anúncios em destaque no jornal digital.",
};

export default async function JournalClassifiedsPage() {
  const premiumClassifieds = await listPremiumClassifieds(24);

  return (
    <div className="newspaper-page mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <NewspaperMasthead />
      <NewspaperCategoryNav activeTab="classificados" />

      <header className="mb-8 border-b-2 border-foreground pb-4">
        <h2 className="text-2xl font-bold uppercase tracking-wide text-foreground sm:text-3xl">
          Classificados premium
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
          Anúncios selecionados pelo editor para aparecer no jornal. Negócios locais em destaque na sua região.
        </p>
      </header>

      {premiumClassifieds.length === 0 ? (
        <p className="py-16 text-center text-muted">Nenhum classificado premium publicado ainda.</p>
      ) : (
        <NewspaperClassifiedsSection ads={premiumClassifieds} hideTitle />
      )}
    </div>
  );
}
