import { APP_NAME } from "@/lib/brand";
import Link from "next/link";
import { CuriosityCard } from "@/components/curiosities/CuriosityCard";
import {
  PublicHomeHero,
  PublicHowItWorks,
  PublicTrustBar,
} from "@/components/home/PublicHomeHero";
import { SiteAnnouncements } from "@/components/site/SiteAnnouncements";
import { WorkshopGrid } from "@/components/workshop/WorkshopGrid";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { curiosities } from "@/data/curiosities";
import { listArticles, seedArticlesIfEmpty } from "@/lib/db/articles";
import { listClassifieds } from "@/lib/db/classifieds";
import { getSponsorshipTier, sortWorkshopsBySponsorship } from "@/lib/db/platform";
import { listWorkshops } from "@/lib/db/workshops";
import type { SponsorshipTier } from "@/types/platform-admin";

export default async function HomePage() {
  await seedArticlesIfEmpty();
  const dbArticles = await listArticles(true);
  const featuredCuriosities = dbArticles.length > 0
    ? dbArticles.slice(0, 3).map((a) => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        content: a.content,
        category: a.category,
        icon: a.icon,
      }))
    : curiosities.slice(0, 3);
  const classifiedPreview = (await listClassifieds({ activeOnly: true })).slice(0, 3);
  const workshops = await sortWorkshopsBySponsorship(await listWorkshops());
  const cities = new Set(workshops.map((w) => w.city));

  const tiers: Record<string, SponsorshipTier> = {};
  for (const w of workshops) {
    tiers[w.id] = await getSponsorshipTier(w.id);
  }

  return (
    <>
      <SiteAnnouncements placement="home_topo" className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8" />
      <PublicHomeHero />
      <PublicTrustBar />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Em destaque"
          title="Oficinas e estéticas perto de você"
          description={`${workshops.length} estabelecimentos em ${cities.size} cidades — patrocinadas aparecem primeiro.`}
          action={
            <Link
              href="/oficinas"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
            >
              Ver diretório completo
              <Icon name="arrow-right" className="h-4 w-4" />
            </Link>
          }
        />
        <WorkshopGrid workshops={workshops} tiers={tiers} limit={6} />
      </section>

      <PublicHowItWorks />

      <SiteAnnouncements placement="home_meio" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" />

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Conteúdo"
            title="Notícias relevantes"
            description={`Avisos e artigos publicados pela equipe ${APP_NAME}.`}
            action={
              <Link
                href="/curiosidades"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
              >
                Ver notícias
                <Icon name="arrow-right" className="h-4 w-4" />
              </Link>
            }
          />
          <div className="grid gap-6 md:grid-cols-3">
            {featuredCuriosities.map((curiosity) => (
              <CuriosityCard key={curiosity.id} curiosity={curiosity} />
            ))}
          </div>
        </div>
      </section>

      {classifiedPreview.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Classificados"
            title="Vendas e oportunidades"
            description="Anúncios de oficinas parceiras"
            action={
              <Link href="/classificados" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover">
                Ver todos
                <Icon name="arrow-right" className="h-4 w-4" />
              </Link>
            }
          />
          <div className="grid gap-6 md:grid-cols-3">
            {classifiedPreview.map((ad) => (
              <article key={ad.id} className="card p-5">
                <span className="text-xs font-semibold uppercase text-accent">{ad.category}</span>
                <h3 className="mt-2 font-semibold">{ad.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{ad.body}</p>
                {ad.price != null && <p className="mt-2 font-medium">R$ {ad.price.toLocaleString("pt-BR")}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="card overflow-hidden">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 sm:p-10 lg:p-12">
              <p className="section-eyebrow mb-3">Para gestores</p>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Sua oficina com perfil profissional na plataforma
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                Catálogo, avaliações, agenda e notas ao cliente — tudo integrado ao painel
                gerencial.
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
