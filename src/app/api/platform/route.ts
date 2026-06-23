import { NextResponse } from "next/server";
import {
  addAnnouncement,
  deleteAnnouncement,
  getActiveAnnouncements,
  getAllAnnouncements,
  getPlatformSettings,
  getSponsorshipTier,
  removeReviewByAdmin,
  restoreReviewByAdmin,
  setAnnouncementActive,
  setWorkshopSponsorship,
  sortWorkshopsBySponsorship,
} from "@/lib/db/platform";
import { listWorkshops } from "@/lib/db/workshops";
import { getRequestUser, userHasPermission } from "@/lib/db/request-auth";
import type { AnnouncementPlacement, SponsorshipTier } from "@/types/platform-admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placement = searchParams.get("placement") as AnnouncementPlacement | null;
  const displayType = searchParams.get("displayType") as "banner" | "modal" | null;
  const scope = searchParams.get("scope");

  if (scope === "admin") {
    const user = await getRequestUser();
    if (!user || user.role !== "master") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    const settings = await getPlatformSettings();
    return NextResponse.json({ settings });
  }

  if (scope === "sorted-workshops") {
    const workshops = await sortWorkshopsBySponsorship(await listWorkshops());
    const tiers = Object.fromEntries(
      await Promise.all(
        workshops.map(async (w) => [w.id, await getSponsorshipTier(w.id)] as const)
      )
    );
    return NextResponse.json({ workshops, tiers });
  }

  const announcements = await getActiveAnnouncements(placement ?? undefined, displayType ?? undefined);
  return NextResponse.json({ announcements });
}

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user || user.role !== "master") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const action = body.action as string;

  if (action === "set-sponsorship") {
    if (!userHasPermission(user, "admin.gerenciar_patrocinios")) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }
    const record = await setWorkshopSponsorship({
      workshopId: body.workshopId as string,
      tier: body.tier as SponsorshipTier,
      monthlyValue: body.monthlyValue as number | undefined,
      notes: body.notes as string | undefined,
    });
    return NextResponse.json({ sponsorship: record });
  }

  if (action === "add-announcement") {
    if (!userHasPermission(user, "admin.gerenciar_anuncios")) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }
    const announcement = await addAnnouncement({
      title: body.title as string,
      message: body.message as string,
      placement: body.placement as AnnouncementPlacement,
      style: body.style as "info" | "promo" | "alerta",
      linkUrl: body.linkUrl as string | undefined,
      linkLabel: body.linkLabel as string | undefined,
      mediaUrl: body.mediaUrl as string | undefined,
      displayType: body.displayType as "banner" | "modal" | undefined,
    });
    return NextResponse.json({ announcement });
  }

  if (action === "toggle-announcement") {
    if (!userHasPermission(user, "admin.gerenciar_anuncios")) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }
    await setAnnouncementActive(body.id as string, body.active as boolean);
    return NextResponse.json({ ok: true });
  }

  if (action === "delete-announcement") {
    if (!userHasPermission(user, "admin.gerenciar_anuncios")) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }
    await deleteAnnouncement(body.id as string);
    return NextResponse.json({ ok: true });
  }

  if (action === "remove-review") {
    if (!userHasPermission(user, "admin.moderar_avaliacoes")) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }
    await removeReviewByAdmin(body.reviewId as string);
    return NextResponse.json({ ok: true });
  }

  if (action === "restore-review") {
    if (!userHasPermission(user, "admin.moderar_avaliacoes")) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }
    await restoreReviewByAdmin(body.reviewId as string);
    return NextResponse.json({ ok: true });
  }

  if (action === "list-announcements") {
    if (!userHasPermission(user, "admin.gerenciar_anuncios")) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }
    const announcements = await getAllAnnouncements();
    return NextResponse.json({ announcements });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
