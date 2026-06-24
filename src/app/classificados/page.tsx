import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { formatClassifiedCategory, listClassifieds } from "@/lib/db/classifieds";

export default async function ClassificadosPage() {
  const ads = await listClassifieds({ activeOnly: true });
  const premium = ads.filter((a) => a.premium);
  const regular = ads.filter((a) => !a.premium);

  function AdCard({ ad, isPremium }: { ad: (typeof ads)[0]; isPremium?: boolean }) {
    const wa = ad.contact?.replace(/\D/g, "");
    return (
      <article
        className={`card flex flex-col overflow-hidden transition hover:shadow-lg ${
          isPremium ? "ring-2 ring-amber-500/30" : ""
        }`}
      >
        <div className="border-b border-border bg-surface-hover/50 px-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-accent">
              {formatClassifiedCategory(ad.category)}
            </span>
            {isPremium && (
              <span className="newspaper-premium-badge text-[10px]">Premium · Jornal</span>
            )}
          </div>
          {ad.workshopName && <p className="text-xs text-muted">{ad.workshopName}</p>}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h2 className="text-lg font-semibold text-foreground">{ad.title}</h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted line-clamp-4">{ad.body}</p>
          {ad.price != null && (
            <p className="mt-3 text-lg font-semibold text-foreground">
              R$ {ad.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          )}
          {wa && (
            <a
              href={`https://wa.me/55${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-sm font-medium text-accent hover:underline"
            >
              Entrar em contato
            </a>
          )}
        </div>
      </article>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Classificados"
        title="Vendas e divulgações"
        description="Anúncios premium também aparecem no Jornal. Demais anúncios ficam nesta vitrine."
      />

      {ads.length === 0 ? (
        <p className="text-muted">Nenhum classificado publicado ainda.</p>
      ) : (
        <>
          {premium.length > 0 && (
            <section className="mb-12">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                Premium
                <span className="newspaper-premium-badge text-[10px]">No jornal</span>
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {premium.map((ad) => (
                  <AdCard key={ad.id} ad={ad} isPremium />
                ))}
              </div>
            </section>
          )}
          {regular.length > 0 && (
            <section>
              {premium.length > 0 && (
                <h2 className="mb-4 text-lg font-semibold text-muted">Demais anúncios</h2>
              )}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {regular.map((ad) => (
                  <AdCard key={ad.id} ad={ad} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <p className="mt-10 text-center text-sm text-muted">
        É dono de negócio?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Publique no painel
        </Link>
        {" · "}
        Destaque premium no jornal via administrador.
      </p>
    </div>
  );
}
