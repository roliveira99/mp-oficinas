import { NextResponse } from "next/server";
import { getCatalogOverride, saveCatalogOverride } from "@/lib/db/workshop-media";
import { mapDbWorkshop } from "@/lib/db/mappers";
import { prisma } from "@/lib/db/prisma";
import { resolveWorkshopPublicCatalog } from "@/lib/db/workshop-catalog";
import { getRequestUser, userHasPermission } from "@/lib/db/request-auth";
import { isOversizedMediaUrl } from "@/lib/media-url";
import type { WorkshopCatalog } from "@/types/workshop";

export async function GET() {
  const user = await getRequestUser();
  if (!user?.workshopId || !userHasPermission(user, "owner.catalogo")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const row = await prisma.workshop.findUnique({ where: { id: user.workshopId } });
  if (!row) {
    return NextResponse.json({ error: "Negócio não encontrado." }, { status: 404 });
  }

  const workshop = mapDbWorkshop(row);
  const catalog = (await getCatalogOverride(user.workshopId)) ?? workshop.catalog;
  const publicCatalog = await resolveWorkshopPublicCatalog(user.workshopId, workshop.catalog);

  return NextResponse.json({ catalog, publicCatalog, slug: row.slug });
}

export async function PUT(request: Request) {
  const user = await getRequestUser();
  if (!user?.workshopId || !userHasPermission(user, "owner.catalogo")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as { catalog: WorkshopCatalog };

  const mediaUrls = [
    ...body.catalog.services.flatMap((i) => [i.imageUrl, i.videoUrl]),
    ...body.catalog.parts.flatMap((i) => [i.imageUrl, i.videoUrl]),
  ].filter((url): url is string => typeof url === "string" && url.length > 0);

  if (mediaUrls.some(isOversizedMediaUrl)) {
    return NextResponse.json(
      { error: "Uma ou mais fotos ou vídeos do catálogo são muito grandes." },
      { status: 413 }
    );
  }

  await saveCatalogOverride(user.workshopId, body.catalog);
  return NextResponse.json({ ok: true });
}
