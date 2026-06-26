import Link from "next/link";
import {
  formatClassifiedCategory,
  type ClassifiedAdRecord,
} from "@/lib/db/classifieds";
import {
  formatClassifiedInstallmentValue,
  formatClassifiedPrice,
  isRecentClassified,
} from "@/lib/classified-format";
import { MediaPreview } from "@/components/ui/MediaPreview";
import { isDataVideoUrl } from "@/lib/media-url";

function ClassifiedMedia({ ad }: { ad: ClassifiedAdRecord }) {
  const src = ad.images[0];
  if (src) {
    return (
      <MediaPreview
        src={src}
        alt=""
        className="classified-product-image"
        videoClassName="classified-product-image"
        controls={!isDataVideoUrl(src)}
      />
    );
  }
  return <div className="classified-product-image classified-product-image-placeholder" aria-hidden />;
}

function whatsAppHref(contact: string | null): string | null {
  const wa = contact?.replace(/\D/g, "");
  if (!wa) return null;
  const text = encodeURIComponent("Olá! Vi seu anúncio nos classificados e gostaria de mais informações.");
  return `https://wa.me/55${wa}?text=${text}`;
}

function ClassifiedCardContent({
  ad,
  waLink,
}: {
  ad: ClassifiedAdRecord;
  waLink: string | null;
}) {
  const isNew = isRecentClassified(ad.createdAt);
  const priceParts = ad.price != null ? formatClassifiedPrice(ad.price) : null;

  return (
    <>
      <div className="classified-product-media">
        <ClassifiedMedia ad={ad} />
      </div>

      {(ad.premium || isNew) && (
        <div className="classified-product-badges">
          {ad.premium && (
            <span className="classified-badge classified-badge-best">Mais vendido</span>
          )}
          {isNew && !ad.premium && (
            <span className="classified-badge classified-badge-deal">Oferta imperdível</span>
          )}
        </div>
      )}

      <h3 className="classified-product-title">{ad.title}</h3>

      {priceParts ? (
        <div className="classified-product-pricing">
          <p className="classified-product-price">
            <span className="classified-price-whole">{priceParts.whole}</span>
            <sup className="classified-price-cents">{priceParts.cents}</sup>
          </p>
          <p className="classified-product-installments">
            em 10x{" "}
            <span className="classified-installment-highlight">
              R$ {formatClassifiedInstallmentValue(ad.price!)} sem juros
            </span>
          </p>
        </div>
      ) : (
        <p className="classified-product-consult">Consulte o valor</p>
      )}

      <div className="classified-product-shipping">
        {waLink ? (
          <>
            <span className="classified-shipping-free">Contato direto</span>
            <span className="classified-shipping-full">WhatsApp</span>
          </>
        ) : (
          <span className="classified-shipping-note">{formatClassifiedCategory(ad.category)}</span>
        )}
      </div>

      {ad.workshopName && <p className="classified-product-seller">{ad.workshopName}</p>}
    </>
  );
}

export function ClassifiedProductCard({
  ad,
  variant = "grid",
}: {
  ad: ClassifiedAdRecord;
  variant?: "grid" | "carousel";
}) {
  const waLink = whatsAppHref(ad.contact);

  return (
    <article className={`classified-product-card classified-product-card-${variant}`}>
      {waLink ? (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="classified-product-link"
        >
          <ClassifiedCardContent ad={ad} waLink={waLink} />
        </a>
      ) : (
        <div className="classified-product-link">
          <ClassifiedCardContent ad={ad} waLink={null} />
        </div>
      )}
    </article>
  );
}

export function ClassifiedProductCardStatic({ ad }: { ad: ClassifiedAdRecord }) {
  const priceParts = ad.price != null ? formatClassifiedPrice(ad.price) : null;

  return (
    <article className="classified-product-card classified-product-card-grid">
      <Link href="/classificados" className="classified-product-link">
        <div className="classified-product-media">
          <ClassifiedMedia ad={ad} />
        </div>
        {ad.premium && (
          <div className="classified-product-badges">
            <span className="classified-badge classified-badge-best">Mais vendido</span>
          </div>
        )}
        <h3 className="classified-product-title">{ad.title}</h3>
        {priceParts && (
          <div className="classified-product-pricing">
            <p className="classified-product-price">
              <span className="classified-price-whole">{priceParts.whole}</span>
              <sup className="classified-price-cents">{priceParts.cents}</sup>
            </p>
          </div>
        )}
      </Link>
    </article>
  );
}
