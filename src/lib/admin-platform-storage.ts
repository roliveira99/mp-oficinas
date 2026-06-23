import { migrateStorageKey, storageKey } from "@/lib/brand";
import type {
  AnnouncementPlacement,
  AnnouncementStyle,
  PlatformAdminSettings,
  SiteAnnouncement,
  SponsorshipTier,
  WorkshopSponsorship,
} from "@/types/platform-admin";
import { sponsorshipTierPriority } from "@/types/platform-admin";
import type { Workshop } from "@/types/workshop";

const SETTINGS_KEY = storageKey("admin-plataforma");

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

function readSettings(): PlatformAdminSettings {
  if (typeof window === "undefined") return defaultSettings;
  migrateStorageKey("admin-plataforma");
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    return defaultSettings;
  }
  try {
    const parsed = JSON.parse(raw) as PlatformAdminSettings;
    return {
      sponsorships: parsed.sponsorships ?? defaultSettings.sponsorships,
      announcements: parsed.announcements ?? defaultSettings.announcements,
      removedReviewIds: parsed.removedReviewIds ?? [],
    };
  } catch {
    return defaultSettings;
  }
}

function writeSettings(settings: PlatformAdminSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getPlatformSettings(): PlatformAdminSettings {
  return readSettings();
}

export function getWorkshopSponsorship(workshopId: string): WorkshopSponsorship | null {
  return readSettings().sponsorships.find((s) => s.workshopId === workshopId) ?? null;
}

export function getSponsorshipTier(workshopId: string): SponsorshipTier {
  return getWorkshopSponsorship(workshopId)?.tier ?? "none";
}

export function setWorkshopSponsorship(input: {
  workshopId: string;
  tier: SponsorshipTier;
  monthlyValue?: number;
  notes?: string;
}): WorkshopSponsorship {
  const settings = readSettings();
  const existing = settings.sponsorships.findIndex((s) => s.workshopId === input.workshopId);
  const record: WorkshopSponsorship = {
    workshopId: input.workshopId,
    tier: input.tier,
    monthlyValue: input.monthlyValue,
    notes: input.notes?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };

  if (input.tier === "none") {
    settings.sponsorships = settings.sponsorships.filter((s) => s.workshopId !== input.workshopId);
  } else if (existing >= 0) {
    settings.sponsorships[existing] = record;
  } else {
    settings.sponsorships.push(record);
  }

  writeSettings(settings);
  return record;
}

export function sortWorkshopsBySponsorship<T extends Workshop>(workshops: T[]): T[] {
  const settings = readSettings();
  const tierOf = (id: string) =>
    settings.sponsorships.find((s) => s.workshopId === id)?.tier ?? "none";

  return [...workshops].sort((a, b) => {
    const diff = sponsorshipTierPriority[tierOf(b.id)] - sponsorshipTierPriority[tierOf(a.id)];
    if (diff !== 0) return diff;
    return b.rating - a.rating;
  });
}

export function getRemovedReviewIds(): Set<string> {
  return new Set(readSettings().removedReviewIds);
}

export function removeReviewByAdmin(reviewId: string): void {
  const settings = readSettings();
  if (!settings.removedReviewIds.includes(reviewId)) {
    settings.removedReviewIds.push(reviewId);
    writeSettings(settings);
  }
}

export function restoreReviewByAdmin(reviewId: string): void {
  const settings = readSettings();
  settings.removedReviewIds = settings.removedReviewIds.filter((id) => id !== reviewId);
  writeSettings(settings);
}

export function getActiveAnnouncements(placement?: AnnouncementPlacement): SiteAnnouncement[] {
  const list = readSettings().announcements.filter((a) => a.active && (a.displayType ?? "banner") === "banner");
  if (!placement) return list;
  return list.filter((a) => a.placement === placement);
}

export function getAllAnnouncements(): SiteAnnouncement[] {
  return readSettings().announcements.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addAnnouncement(input: {
  title: string;
  message: string;
  placement: AnnouncementPlacement;
  style: AnnouncementStyle;
  linkUrl?: string;
  linkLabel?: string;
}): SiteAnnouncement {
  const settings = readSettings();
  const announcement: SiteAnnouncement = {
    id: `ann-${Date.now()}`,
    title: input.title.trim(),
    message: input.message.trim(),
    placement: input.placement,
    style: input.style,
    linkUrl: input.linkUrl?.trim() || undefined,
    linkLabel: input.linkLabel?.trim() || undefined,
    active: true,
    createdAt: new Date().toISOString(),
  };
  settings.announcements.unshift(announcement);
  writeSettings(settings);
  return announcement;
}

export function setAnnouncementActive(id: string, active: boolean): void {
  const settings = readSettings();
  const index = settings.announcements.findIndex((a) => a.id === id);
  if (index >= 0) {
    settings.announcements[index] = { ...settings.announcements[index], active };
    writeSettings(settings);
  }
}

export function deleteAnnouncement(id: string): void {
  const settings = readSettings();
  settings.announcements = settings.announcements.filter((a) => a.id !== id);
  writeSettings(settings);
}
