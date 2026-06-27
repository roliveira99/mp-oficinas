"use client";

import type { ReviewStats, StarRating, VerifiedClient, WorkshopReview } from "@/types/review";

export async function fetchWorkshopReviews(slug: string): Promise<{
  reviews: WorkshopReview[];
  stats: ReviewStats;
  workshopId: string;
}> {
  const res = await fetch(`/api/workshops/${encodeURIComponent(slug)}/reviews`);
  if (!res.ok) throw new Error("Falha ao carregar avaliações.");
  return res.json() as Promise<{
    reviews: WorkshopReview[];
    stats: ReviewStats;
    workshopId: string;
  }>;
}

export async function fetchReviewStatsBySlug(
  slug: string,
  fallbackAverage: number,
  fallbackCount: number
): Promise<ReviewStats> {
  try {
    const { stats } = await fetchWorkshopReviews(slug);
    return stats.count > 0 ? stats : { average: fallbackAverage, count: fallbackCount };
  } catch {
    return { average: fallbackAverage, count: fallbackCount };
  }
}

export async function submitWorkshopReview(
  slug: string,
  input: { cpf: string; stars: StarRating; comment: string }
): Promise<{ review: WorkshopReview; stats: ReviewStats } | { error: string }> {
  const res = await fetch(`/api/workshops/${encodeURIComponent(slug)}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as {
    review?: WorkshopReview;
    stats?: ReviewStats;
    error?: string;
  };
  if (!res.ok || !data.review || !data.stats) {
    return { error: data.error ?? "Não foi possível salvar a avaliação." };
  }
  return { review: data.review, stats: data.stats };
}

export async function verifyWorkshopClient(
  slug: string,
  input: { cpf: string; plate?: string; name?: string; phone?: string; birthDate?: string }
): Promise<
  | { client: VerifiedClient; existingReview: WorkshopReview | null }
  | { needsRegistration: true }
  | { error: string }
> {
  const res = await fetch(`/api/workshops/${encodeURIComponent(slug)}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify", ...input }),
  });
  const data = (await res.json()) as {
    client?: VerifiedClient;
    existingReview?: WorkshopReview | null;
    needsRegistration?: boolean;
    error?: string;
  };
  if (data.needsRegistration) return { needsRegistration: true };
  if (!res.ok || !data.client) return { error: data.error ?? "Não foi possível verificar elegibilidade." };
  return { client: data.client, existingReview: data.existingReview ?? null };
}

export async function fetchAdminReviews(): Promise<(WorkshopReview & { removed: boolean })[]> {
  const res = await fetch("/api/admin/reviews");
  if (!res.ok) return [];
  const data = (await res.json()) as { reviews: (WorkshopReview & { removed: boolean })[] };
  return data.reviews;
}

export function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
