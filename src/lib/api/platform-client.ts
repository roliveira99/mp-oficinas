"use client";

import type { AnnouncementPlacement, PlatformAdminSettings, SiteAnnouncement, SponsorshipTier, WorkshopSponsorship } from "@/types/platform-admin";
import type { Workshop } from "@/types/workshop";

export async function fetchSortedWorkshops(): Promise<{
  workshops: Workshop[];
  tiers: Record<string, SponsorshipTier>;
}> {
  const res = await fetch("/api/platform?scope=sorted-workshops");
  if (!res.ok) throw new Error("Falha ao carregar oficinas.");
  return res.json() as Promise<{ workshops: Workshop[]; tiers: Record<string, SponsorshipTier> }>;
}

export async function fetchActiveAnnouncements(
  placement: AnnouncementPlacement
): Promise<SiteAnnouncement[]> {
  const params = new URLSearchParams({
    placement,
    displayType: "banner",
  });
  const res = await fetch(`/api/platform?${params}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { announcements: SiteAnnouncement[] };
  return data.announcements;
}

export async function fetchPlatformSettings(): Promise<PlatformAdminSettings> {
  const res = await fetch("/api/platform?scope=admin");
  if (!res.ok) throw new Error("Não autorizado.");
  const data = (await res.json()) as { settings: PlatformAdminSettings };
  return data.settings;
}

export async function apiSetWorkshopSponsorship(input: {
  workshopId: string;
  tier: SponsorshipTier;
  monthlyValue?: number;
  notes?: string;
}): Promise<WorkshopSponsorship> {
  const res = await fetch("/api/platform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "set-sponsorship", ...input }),
  });
  if (!res.ok) throw new Error("Falha ao salvar patrocínio.");
  const data = (await res.json()) as { sponsorship: WorkshopSponsorship };
  return data.sponsorship;
}

export async function apiAddAnnouncement(input: {
  title: string;
  message: string;
  placement: AnnouncementPlacement;
  style: SiteAnnouncement["style"];
  linkUrl?: string;
  linkLabel?: string;
  mediaUrl?: string;
  displayType?: SiteAnnouncement["displayType"];
}): Promise<SiteAnnouncement> {
  const res = await fetch("/api/platform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "add-announcement", ...input }),
  });
  if (!res.ok) throw new Error("Falha ao criar anúncio.");
  const data = (await res.json()) as { announcement: SiteAnnouncement };
  return data.announcement;
}

export async function apiToggleAnnouncement(id: string, active: boolean): Promise<void> {
  await fetch("/api/platform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "toggle-announcement", id, active }),
  });
}

export async function apiDeleteAnnouncement(id: string): Promise<void> {
  await fetch("/api/platform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete-announcement", id }),
  });
}

export async function apiRemoveReview(reviewId: string): Promise<void> {
  await fetch("/api/platform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "remove-review", reviewId }),
  });
}

export async function apiRestoreReview(reviewId: string): Promise<void> {
  await fetch("/api/platform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "restore-review", reviewId }),
  });
}

export async function apiFetchAllAnnouncements(): Promise<SiteAnnouncement[]> {
  const res = await fetch("/api/platform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "list-announcements" }),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { announcements: SiteAnnouncement[] };
  return data.announcements;
}
