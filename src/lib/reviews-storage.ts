import { migrateStorageKey, storageKey } from "@/lib/brand";
import { getRemovedReviewIds } from "@/lib/admin-platform-storage";
import { seedReviews, verifiedClientsByWorkshop } from "@/data/verified-clients";
import { normalizeCpf } from "@/lib/cpf";
import { getVerifiedClientsFromCrm } from "@/lib/workshop-crm-storage";
import type { ReviewStats, StarRating, VerifiedClient, WorkshopReview } from "@/types/review";

const REVIEWS_KEY = storageKey("avaliacoes");

function readAllReviews(): WorkshopReview[] {
  if (typeof window === "undefined") return seedReviews;
  migrateStorageKey("avaliacoes");
  const raw = localStorage.getItem(REVIEWS_KEY);
  const stored: WorkshopReview[] = raw ? (JSON.parse(raw) as WorkshopReview[]) : [];
  const byKey = new Map<string, WorkshopReview>();

  for (const review of seedReviews) {
    byKey.set(`${review.workshopId}:${review.cpf}`, review);
  }
  for (const review of stored) {
    byKey.set(`${review.workshopId}:${review.cpf}`, review);
  }

  return Array.from(byKey.values())
    .filter((r) => !getRemovedReviewIds().has(r.id))
    .sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/** Lista completa para moderação admin (inclui removidas). */
export function getAllReviewsForAdmin(): WorkshopReview[] {
  if (typeof window === "undefined") return seedReviews;
  const raw = localStorage.getItem(REVIEWS_KEY);
  const stored: WorkshopReview[] = raw ? (JSON.parse(raw) as WorkshopReview[]) : [];
  const byKey = new Map<string, WorkshopReview>();
  for (const review of seedReviews) {
    byKey.set(`${review.workshopId}:${review.cpf}`, review);
  }
  for (const review of stored) {
    byKey.set(`${review.workshopId}:${review.cpf}`, review);
  }
  return Array.from(byKey.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function isReviewRemoved(reviewId: string): boolean {
  return getRemovedReviewIds().has(reviewId);
}

function writeStoredReviews(reviews: WorkshopReview[]) {
  const seedKeys = new Set(seedReviews.map((r) => `${r.workshopId}:${r.cpf}`));
  const custom = reviews.filter((r) => !seedKeys.has(`${r.workshopId}:${r.cpf}`));
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(custom));
}

function getAllVerifiedClients(workshopId: string): VerifiedClient[] {
  const byCpf = new Map<string, VerifiedClient>();

  for (const seed of verifiedClientsByWorkshop[workshopId] ?? []) {
    byCpf.set(seed.cpf, seed);
  }

  for (const client of getVerifiedClientsFromCrm(workshopId)) {
    const existing = byCpf.get(client.cpf);
    if (existing) {
      const orderIds = new Set(existing.completedServices.map((s) => s.orderId));
      const merged = [...existing.completedServices];
      for (const service of client.completedServices) {
        if (!orderIds.has(service.orderId)) merged.push(service);
      }
      byCpf.set(client.cpf, { ...existing, name: client.name, completedServices: merged });
    } else {
      byCpf.set(client.cpf, client);
    }
  }

  return Array.from(byCpf.values());
}

export function getVerifiedClient(workshopId: string, cpf: string): VerifiedClient | null {
  const normalized = normalizeCpf(cpf);
  return getAllVerifiedClients(workshopId).find((c) => c.cpf === normalized) ?? null;
}

export function hasCompletedService(workshopId: string, cpf: string): boolean {
  const client = getVerifiedClient(workshopId, cpf);
  return (client?.completedServices.length ?? 0) > 0;
}

export function getReviewsForWorkshop(workshopId: string): WorkshopReview[] {
  return readAllReviews().filter((r) => r.workshopId === workshopId);
}

export function getReviewByCpf(workshopId: string, cpf: string): WorkshopReview | null {
  const normalized = normalizeCpf(cpf);
  return getReviewsForWorkshop(workshopId).find((r) => r.cpf === normalized) ?? null;
}

export function getReviewStats(workshopId: string, fallbackAverage = 0, fallbackCount = 0): ReviewStats {
  const reviews = getReviewsForWorkshop(workshopId);
  if (reviews.length === 0) {
    return { average: fallbackAverage, count: fallbackCount };
  }
  const sum = reviews.reduce((acc, r) => acc + r.stars, 0);
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}

export function upsertReview(input: {
  workshopId: string;
  cpf: string;
  stars: StarRating;
  comment: string;
}): { ok: true; review: WorkshopReview } | { ok: false; error: string } {
  const normalized = normalizeCpf(input.cpf);
  const client = getVerifiedClient(input.workshopId, normalized);

  if (!client || client.completedServices.length === 0) {
    return {
      ok: false,
      error: "Só é possível avaliar após um serviço concluído neste estabelecimento. Informe o CPF usado no cadastro da oficina.",
    };
  }

  const latestService = [...client.completedServices].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  const all = readAllReviews();
  const existing = all.find((r) => r.workshopId === input.workshopId && r.cpf === normalized);
  const now = new Date().toISOString();

  const review: WorkshopReview = existing
    ? {
        ...existing,
        stars: input.stars,
        comment: input.comment.trim(),
        serviceLabel: latestService.service,
        updatedAt: now,
      }
    : {
        id: `rev-${Date.now()}`,
        workshopId: input.workshopId,
        cpf: normalized,
        clientName: client.name,
        stars: input.stars,
        comment: input.comment.trim(),
        serviceLabel: latestService.service,
        createdAt: now,
        updatedAt: now,
      };

  const next = all.filter((r) => !(r.workshopId === input.workshopId && r.cpf === normalized));
  next.push(review);
  writeStoredReviews(next);

  return { ok: true, review };
}

export function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
