import { NextResponse } from "next/server";
import {
  createClassified,
  deleteClassified,
  listClassifieds,
  updateClassified,
} from "@/lib/db/classifieds";
import { getRequestUser, userHasPermission } from "@/lib/db/request-auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user = await getRequestUser();
  const workshopId = searchParams.get("workshopId") ?? user?.workshopId ?? undefined;
  const mine = searchParams.get("mine") === "1";
  const admin = searchParams.get("admin") === "1";
  const premiumOnly = searchParams.get("premium") === "1";

  if (admin) {
    if (!user || user.role !== "master") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    const ads = await listClassifieds({ activeOnly: false, premiumOnly: premiumOnly || undefined });
    return NextResponse.json({ ads });
  }

  const ads = await listClassifieds({
    workshopId: mine && user?.workshopId ? user.workshopId : workshopId,
    activeOnly: !mine,
    premiumOnly: premiumOnly || undefined,
  });
  return NextResponse.json({ ads });
}

export async function POST(request: Request) {
  const user = await getRequestUser();
  const body = (await request.json()) as Record<string, unknown>;
  const action = body.action as string;
  const isMaster = user?.role === "master";

  switch (action) {
    case "create": {
      if (isMaster && userHasPermission(user, "admin.gerenciar_anuncios")) {
        const ad = await createClassified({
          workshopId: body.workshopId as string | undefined,
          title: body.title as string,
          body: body.body as string,
          price: body.price !== undefined ? Number(body.price) : undefined,
          contact: body.contact as string | undefined,
          category: body.category as string | undefined,
          images: body.images as string[] | undefined,
          premium: body.premium as boolean | undefined,
        });
        return NextResponse.json({ ok: true, ad });
      }
      if (!user?.workshopId || user.role !== "dono") {
        return NextResponse.json({ error: "Apenas o dono pode publicar classificados." }, { status: 403 });
      }
      const ad = await createClassified({
        workshopId: user.workshopId,
        title: body.title as string,
        body: body.body as string,
        price: body.price !== undefined ? Number(body.price) : undefined,
        contact: body.contact as string | undefined,
        category: body.category as string | undefined,
        premium: false,
      });
      return NextResponse.json({ ok: true, ad });
    }
    case "update": {
      if (isMaster && userHasPermission(user, "admin.gerenciar_anuncios")) {
        const result = await updateClassified(
          body.id as string,
          undefined,
          {
            title: body.title as string | undefined,
            body: body.body as string | undefined,
            price: body.price !== undefined ? Number(body.price) : undefined,
            contact: body.contact as string | undefined,
            category: body.category as string | undefined,
            premium: body.premium as boolean | undefined,
            active: body.active as boolean | undefined,
          },
          { allowPremium: true }
        );
        return NextResponse.json(result);
      }
      if (!user?.workshopId) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
      const result = await updateClassified(body.id as string, user.workshopId, {
        title: body.title as string | undefined,
        body: body.body as string | undefined,
        price: body.price !== undefined ? Number(body.price) : undefined,
        contact: body.contact as string | undefined,
        category: body.category as string | undefined,
        active: body.active as boolean | undefined,
      });
      return NextResponse.json(result);
    }
    case "delete": {
      if (isMaster && userHasPermission(user, "admin.gerenciar_anuncios")) {
        const result = await deleteClassified(body.id as string);
        return NextResponse.json(result);
      }
      if (!user?.workshopId) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
      const result = await deleteClassified(body.id as string, user.workshopId);
      return NextResponse.json(result);
    }
    default:
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }
}
