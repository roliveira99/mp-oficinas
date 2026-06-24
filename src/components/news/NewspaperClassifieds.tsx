import Link from "next/link";
import { formatClassifiedCategory, type ClassifiedAdRecord } from "@/lib/db/classifieds";

function ClassifiedImage({ ad, className }: { ad: ClassifiedAdRecord; className?: string }) {
  const src = ad.images[0];
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={className} />
    );
  }
  return (
    <div
      className={`newspaper-classified-placeholder ${className ?? ""}`}
      aria-hidden
    />
  );
}

export function NewspaperClassifiedCard({ ad }: { ad: ClassifiedAdRecord }) {
  const wa = ad.contact?.replace(/\D/g, "");

  return (
    <article className="newspaper-classified-card group flex h-full flex-col overflow-hidden rounded-sm border border-border bg-surface transition hover:shadow-md">
      <div className="relative overflow-hidden">
        <ClassifiedImage
          ad={ad}
          className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
        <span className="newspaper-premium-badge absolute left-3 top-3">Premium</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-muted">
          <span className="font-semibold text-accent">{formatClassifiedCategory(ad.category)}</span>
          {ad.workshopName && <span>{ad.workshopName}</span>}
        </div>
        <h3 className="text-base font-semibold leading-snug text-foreground">{ad.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted">{ad.body}</p>
        {ad.price != null && (
          <p className="mt-3 text-lg font-bold text-foreground">
            R$ {ad.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {wa && (
            <a
              href={`https://wa.me/55${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
            >
              WhatsApp
            </a>
          )}
          <Link
            href="/classificados"
            className="inline-flex rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-accent"
          >
            Ver classificados
          </Link>
        </div>
      </div>
    </article>
  );
}

export function NewspaperClassifiedsSection({
  ads,
  compact = false,
  hideTitle = false,
}: {
  ads: ClassifiedAdRecord[];
  compact?: boolean;
  hideTitle?: boolean;
}) {
  if (ads.length === 0) return null;

  return (
    <section
      id="secao-classificados"
      className={`scroll-mt-24 ${compact ? "mt-10" : "mt-12"} border-t-2 border-foreground pt-8`}
    >
      {!hideTitle && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-xl font-bold uppercase tracking-wide text-foreground">
                Classificados premium
              </h2>
              <span className="newspaper-premium-badge inline-flex text-[10px]">Premium</span>
            </div>
            <p className="text-sm text-muted">
              Anúncios em destaque no jornal — vendas, serviços e oportunidades da região
            </p>
          </div>
          <Link href="/curiosidades/classificados" className="text-sm font-semibold text-accent hover:underline">
            Ver seção →
          </Link>
        </div>
      )}

      <div className={`grid gap-6 ${compact ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        {ads.map((ad) => (
          <NewspaperClassifiedCard key={ad.id} ad={ad} />
        ))}
      </div>
    </section>
  );
}
