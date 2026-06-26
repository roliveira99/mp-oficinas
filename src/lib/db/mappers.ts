import type { Workshop as DbWorkshop } from "@prisma/client";
import type { Workshop, WorkshopCatalog, WorkshopGalleryItem } from "@/types/workshop";

export function mapDbWorkshop(row: DbWorkshop): Workshop {
  const catalogOverride = row.catalogOverride as unknown as WorkshopCatalog | null;
  const baseCatalog = row.catalog as unknown as WorkshopCatalog;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    vertical: (row.vertical ?? "automotive") as Workshop["vertical"],
    category: row.category ?? null,
    type: row.type,
    description: row.description,
    tagline: row.tagline ?? undefined,
    address: row.address,
    city: row.city,
    state: row.state,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    rating: row.rating,
    reviewCount: row.reviewCount,
    services: row.services as unknown as string[],
    openingHours: row.openingHours,
    image: row.image,
    coverImage: row.coverImage ?? undefined,
    gallery: (row.gallery as unknown as WorkshopGalleryItem[] | null) ?? undefined,
    profileVideos: (row.profileVideos as unknown as string[] | null) ?? undefined,
    specialties: row.specialties as unknown as string[],
    hasAgenda: row.hasAgenda,
    paymentMethods: row.paymentMethods as unknown as string[],
    catalog: catalogOverride ?? baseCatalog,
    blocked: row.blocked ?? false,
    mechanicRanking:
      (row.mechanicRanking as unknown as Workshop["mechanicRanking"]) ?? undefined,
  };
}
