import type {
  AnnouncementPlacement,
  PlatformAdminSettings,
  SiteAnnouncement,
  SponsorshipTier,
  WorkshopSponsorship,
} from "@/types/platform-admin";
import { sponsorshipTierPriority } from "@/types/platform-admin";
import type { Workshop } from "@/types/workshop";
import { isDatabaseReachable, prisma } from "@/lib/db/prisma";

const defaultSettings: PlatformAdminSettings = {
  sponsorships: [
    {
      workshopId: "1",
      tier: "ouro",
      monthlyValue: 890,
      notes: "Patrocínio premium — destaque máximo",
      updatedAt: "2026-06-01T12:00:00.000Z",
    },
    {
      workshopId: "7",
      tier: "prata",
      monthlyValue: 490,
      notes: "Estética em destaque regional",
      updatedAt: "2026-06-01T12:00:00.000Z",
    },
  ],
  announcements: [],
  removedReviewIds: [],
};

function mapSponsorship(row: {
  workshopId: string;
  tier: string;
  monthlyValue: number | null;
  notes: string | null;
  updatedAt: Date;
}): WorkshopSponsorship {
  return {
    workshopId: row.workshopId,
    tier: row.tier as SponsorshipTier,
    monthlyValue: row.monthlyValue ?? undefined,
    notes: row.notes ?? undefined,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapAnnouncement(row: {
  id: string;
  title: string;
  message: string;
  linkUrl: string | null;
  linkLabel: string | null;
  mediaUrl?: string | null;
  placement: string;
  style: string;
  displayType?: string;
  active: boolean;
  createdAt: Date;
}): SiteAnnouncement {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    linkUrl: row.linkUrl ?? undefined,
    linkLabel: row.linkLabel ?? undefined,
    mediaUrl: row.mediaUrl ?? undefined,
    placement: row.placement as AnnouncementPlacement,
    style: row.style as SiteAnnouncement["style"],
    displayType: (row.displayType as SiteAnnouncement["displayType"]) ?? "banner",
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getPlatformSettings(): Promise<PlatformAdminSettings> {
  if (!(await isDatabaseReachable())) return defaultSettings;

  const [sponsorships, announcements, removedReviews] = await Promise.all([
    prisma.sponsorship.findMany(),
    prisma.siteAnnouncement.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.review.findMany({ where: { removed: true }, select: { id: true } }),
  ]);

  return {
    sponsorships: sponsorships.map(mapSponsorship),
    announcements: announcements.map(mapAnnouncement),
    removedReviewIds: removedReviews.map((r) => r.id),
  };
}

export async function getSponsorshipTier(workshopId: string): Promise<SponsorshipTier> {
  if (!(await isDatabaseReachable())) {
    return defaultSettings.sponsorships.find((s) => s.workshopId === workshopId)?.tier ?? "none";
  }

  const row = await prisma.sponsorship.findUnique({ where: { workshopId } });
  return (row?.tier as SponsorshipTier) ?? "none";
}

export async function setWorkshopSponsorship(input: {
  workshopId: string;
  tier: SponsorshipTier;
  monthlyValue?: number;
  notes?: string;
}): Promise<WorkshopSponsorship> {
  if (!(await isDatabaseReachable())) {
    throw new Error("Banco de dados indisponível");
  }

  if (input.tier === "none") {
    await prisma.sponsorship.deleteMany({ where: { workshopId: input.workshopId } });
    return {
      workshopId: input.workshopId,
      tier: "none",
      updatedAt: new Date().toISOString(),
    };
  }

  const row = await prisma.sponsorship.upsert({
    where: { workshopId: input.workshopId },
    create: {
      workshopId: input.workshopId,
      tier: input.tier,
      monthlyValue: input.monthlyValue,
      notes: input.notes?.trim() || null,
    },
    update: {
      tier: input.tier,
      monthlyValue: input.monthlyValue,
      notes: input.notes?.trim() || null,
    },
  });

  return mapSponsorship(row);
}

export async function sortWorkshopsBySponsorship<T extends Workshop>(
  workshops: T[]
): Promise<T[]> {
  const settings = await getPlatformSettings();
  const tierOf = (id: string) =>
    settings.sponsorships.find((s) => s.workshopId === id)?.tier ?? "none";

  return [...workshops].sort((a, b) => {
    const diff = sponsorshipTierPriority[tierOf(b.id)] - sponsorshipTierPriority[tierOf(a.id)];
    if (diff !== 0) return diff;
    return b.rating - a.rating;
  });
}

export async function getActiveAnnouncements(
  placement?: AnnouncementPlacement,
  displayType?: "banner" | "modal"
): Promise<SiteAnnouncement[]> {
  const settings = await getPlatformSettings();
  let list = settings.announcements.filter((a) => a.active);
  if (displayType) {
    list = list.filter((a) => (a.displayType ?? "banner") === displayType);
  }
  if (!placement) return list;
  return list.filter((a) => a.placement === placement);
}

export async function getAllAnnouncements(): Promise<SiteAnnouncement[]> {
  const settings = await getPlatformSettings();
  return settings.announcements;
}

export async function addAnnouncement(input: {
  title: string;
  message: string;
  placement: AnnouncementPlacement;
  style: SiteAnnouncement["style"];
  linkUrl?: string;
  linkLabel?: string;
  mediaUrl?: string;
  displayType?: SiteAnnouncement["displayType"];
}): Promise<SiteAnnouncement> {
  const announcement: SiteAnnouncement = {
    id: `ann-${Date.now()}`,
    title: input.title.trim(),
    message: input.message.trim(),
    placement: input.placement,
    style: input.style,
    linkUrl: input.linkUrl?.trim() || undefined,
    linkLabel: input.linkLabel?.trim() || undefined,
    mediaUrl: input.mediaUrl?.trim() || undefined,
    displayType: input.displayType ?? "banner",
    active: true,
    createdAt: new Date().toISOString(),
  };

  if (await isDatabaseReachable()) {
    await prisma.siteAnnouncement.create({
      data: {
        id: announcement.id,
        title: announcement.title,
        message: announcement.message,
        placement: announcement.placement,
        style: announcement.style,
        linkUrl: announcement.linkUrl ?? null,
        linkLabel: announcement.linkLabel ?? null,
        mediaUrl: announcement.mediaUrl ?? null,
        displayType: announcement.displayType,
        active: true,
        createdAt: new Date(announcement.createdAt),
      },
    });
  }

  return announcement;
}

export async function setAnnouncementActive(id: string, active: boolean): Promise<void> {
  if (!(await isDatabaseReachable())) return;
  await prisma.siteAnnouncement.updateMany({ where: { id }, data: { active } });
}

export async function deleteAnnouncement(id: string): Promise<void> {
  if (!(await isDatabaseReachable())) return;
  await prisma.siteAnnouncement.deleteMany({ where: { id } });
}

export async function removeReviewByAdmin(reviewId: string): Promise<void> {
  await setReviewRemoved(reviewId, true);
}

export async function restoreReviewByAdmin(reviewId: string): Promise<void> {
  await setReviewRemoved(reviewId, false);
}

async function setReviewRemoved(reviewId: string, removed: boolean): Promise<void> {
  if (!(await isDatabaseReachable())) return;
  await prisma.review.updateMany({ where: { id: reviewId }, data: { removed } });
}

export async function getRemovedReviewIds(): Promise<Set<string>> {
  const settings = await getPlatformSettings();
  return new Set(settings.removedReviewIds);
}
