import { NextResponse } from "next/server";
import { getWorkshopMedia, updateWorkshopMedia } from "@/lib/db/workshop-media";
import { getRequestUser, userHasPermission } from "@/lib/db/request-auth";
import { isOversizedMediaUrl } from "@/lib/media-url";
import type { WorkshopGalleryItem, WorkshopShowcaseItem } from "@/types/workshop";

export async function GET() {
  const user = await getRequestUser();
  if (!user?.workshopId || !userHasPermission(user, "owner.perfil")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const media = await getWorkshopMedia(user.workshopId);
  return NextResponse.json(media);
}

export async function PUT(request: Request) {
  const user = await getRequestUser();
  if (!user?.workshopId || !userHasPermission(user, "owner.perfil")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as {
    coverImage?: string;
    tagline?: string;
    slogan?: string;
    gallery?: WorkshopGalleryItem[];
    profileVideos?: string[];
    profileShowcase?: WorkshopShowcaseItem[];
    profileHighlights?: { title: string; body: string }[];
    businessOpportunities?: { title: string; body: string }[];
  };

  const tooLarge = [
    body.coverImage,
    ...(body.gallery?.map((g) => g.url) ?? []),
    ...(body.profileVideos ?? []),
    ...(body.profileShowcase?.map((item) => item.url) ?? []),
  ].some(isOversizedMediaUrl);

  if (tooLarge) {
    return NextResponse.json(
      { error: "Um ou mais arquivos são muito grandes. Use fotos menores ou vídeos de até 5 MB." },
      { status: 413 }
    );
  }

  await updateWorkshopMedia(user.workshopId, body);
  const media = await getWorkshopMedia(user.workshopId);
  return NextResponse.json(media);
}
