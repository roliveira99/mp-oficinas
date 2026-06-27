import type { Prisma } from "@prisma/client";
import { isDatabaseReachable, prisma } from "@/lib/db/prisma";
import type { WorkshopCatalog, WorkshopGalleryItem, WorkshopShowcaseItem } from "@/types/workshop";

export async function getCatalogOverride(workshopId: string): Promise<WorkshopCatalog | null> {
  if (!(await isDatabaseReachable())) return null;
  const row = await prisma.workshop.findUnique({
    where: { id: workshopId },
    select: { catalogOverride: true },
  });
  return (row?.catalogOverride as WorkshopCatalog | null) ?? null;
}

export async function saveCatalogOverride(
  workshopId: string,
  catalog: WorkshopCatalog
): Promise<void> {
  await prisma.workshop.update({
    where: { id: workshopId },
    data: { catalogOverride: catalog as unknown as Prisma.InputJsonValue },
  });
}

export async function getWorkshopMedia(workshopId: string): Promise<{
  coverImage: string | null;
  tagline: string | null;
  slogan: string | null;
  gallery: WorkshopGalleryItem[];
  profileVideos: string[];
  profileShowcase: WorkshopShowcaseItem[];
  profileHighlights: { title: string; body: string }[];
  businessOpportunities: { title: string; body: string }[];
}> {
  const row = await prisma.workshop.findUniqueOrThrow({
    where: { id: workshopId },
    select: {
      coverImage: true,
      tagline: true,
      slogan: true,
      gallery: true,
      profileVideos: true,
      profileShowcase: true,
      profileHighlights: true,
      businessOpportunities: true,
    },
  });
  return {
    coverImage: row.coverImage,
    tagline: row.tagline,
    slogan: row.slogan,
    gallery: (row.gallery as WorkshopGalleryItem[] | null) ?? [],
    profileVideos: (row.profileVideos as string[] | null) ?? [],
    profileShowcase: (row.profileShowcase as WorkshopShowcaseItem[] | null) ?? [],
    profileHighlights: (row.profileHighlights as { title: string; body: string }[] | null) ?? [],
    businessOpportunities: (row.businessOpportunities as { title: string; body: string }[] | null) ?? [],
  };
}

export async function updateWorkshopMedia(
  workshopId: string,
  input: {
    coverImage?: string;
    tagline?: string;
    slogan?: string;
    gallery?: WorkshopGalleryItem[];
    profileVideos?: string[];
    profileShowcase?: WorkshopShowcaseItem[];
    profileHighlights?: { title: string; body: string }[];
    businessOpportunities?: { title: string; body: string }[];
  }
): Promise<void> {
  await prisma.workshop.update({
    where: { id: workshopId },
    data: {
      ...(input.coverImage !== undefined ? { coverImage: input.coverImage || null } : {}),
      ...(input.tagline !== undefined ? { tagline: input.tagline || null } : {}),
      ...(input.slogan !== undefined ? { slogan: input.slogan || null } : {}),
      ...(input.gallery !== undefined
        ? { gallery: input.gallery as unknown as Prisma.InputJsonValue }
        : {}),
      ...(input.profileVideos !== undefined
        ? { profileVideos: input.profileVideos as unknown as Prisma.InputJsonValue }
        : {}),
      ...(input.profileShowcase !== undefined
        ? { profileShowcase: input.profileShowcase as unknown as Prisma.InputJsonValue }
        : {}),
      ...(input.profileHighlights !== undefined
        ? { profileHighlights: input.profileHighlights as unknown as Prisma.InputJsonValue }
        : {}),
      ...(input.businessOpportunities !== undefined
        ? { businessOpportunities: input.businessOpportunities as unknown as Prisma.InputJsonValue }
        : {}),
    },
  });
}
