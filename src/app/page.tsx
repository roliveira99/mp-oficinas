import { APP_NAME } from "@/lib/brand";
import { getPlatformTerminology } from "@/lib/platform-routes";
import Link from "next/link";
import { NewspaperHomeTop } from "@/components/news/NewspaperHomeTop";
import { PublicHomeHero } from "@/components/home/PublicHomeHero";
import { SiteAnnouncements } from "@/components/site/SiteAnnouncements";
import { WorkshopGrid } from "@/components/workshop/WorkshopGrid";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { normalizeCityFilter } from "@/lib/cities";
import { listArticles, seedArticlesIfEmpty } from "@/lib/db/articles";
import { listPremiumClassifieds } from "@/lib/db/classifieds";
import { getSponsorshipTier, sortWorkshopsBySponsorship } from "@/lib/db/platform";
import { listWorkshops } from "@/lib/db/workshops";
import type { SponsorshipTier } from "@/types/platform-admin";

type HomePageProps = {
  searchParams: Promise<{ cidade?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { cidade } = await searchParams;
  const cityFilter = normalizeCityFilter(cidade);

  await seedArticlesIfEmpty();
  const [journalArticles, premiumClassifieds] = await Promise.all([
    listArticles({ activeOnly: true, city: cityFilter }),
    listPremiumClassifieds(4, cityFilter),
  ]);
  const workshops = await sortWorkshopsBySponsorship(
    await listWorkshops(cityFilter ? { city: cityFilter } : undefined)
  );
  const cities = new Set(workshops.map((w) => w.city));

  const tiers: Record<string, SponsorshipTier> = {};
  for (const w of workshops) {
    tiers[w.id] = await getSponsorshipTier(w.id);
  }

  const terms = getPlatformTerminology();
  const cityLabel = cityFilter ? ` em ${cityFilter}` : "";

  return (
    <>
      <SiteAnnouncements placement="home_topo" className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8" />

      <NewspaperHomeTop
        articles={journalArticles}
        premiumClassifieds={premiumClassifieds}
        selectedCity={cityFilter}
      />

      <PublicHomeHero selectedCity={cityFilter} />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Em destaque"
          title={`${terms.homeFeaturedTitle}${cityLabel}`}
          description={`${workshops.length} estabelecimentos em ${cities.size || 1} cidade${cities.size === 1 ? "" : "s"} — patrocinados aparecem primeiro.`}
          action={
            <Link
              href={cityFilter ? `${terms.directoryPath}?cidade=${encodeURIComponent(cityFilter)}` : terms.directoryPath}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
            >
              Ver diretório completo
              <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
          }
        />
        <WorkshopGrid workshops={workshops} tiers={tiers} limit={6} />
      </section>

      <SiteAnnouncements placement="home_meio" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="card overflow-hidden">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 sm:p-10 lg:p-12">
              <p className="section-eyebrow mb-3">Para gestores</p>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {terms.homeManagerTitle}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                {terms.homeManagerDescription}
              </p>
              <div className="mt-8">
                <ButtonLink href="/login" variant="primary">
                  Entrar no painel
                </ButtonLink>
              </div>
            </div>
            <div
              className="min-h-[200px] border-t border-border bg-cover bg-center lg:border-t-0 lg:border-l"
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=800&q=80)",
              }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
