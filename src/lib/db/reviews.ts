import { seedReviews, verifiedClientsByWorkshop } from "@/data/verified-clients";
import { normalizeCpf } from "@/lib/cpf";
import { isDatabaseReachable, prisma } from "@/lib/db/prisma";
import { getOperationalConfig } from "@/lib/verticals/operational";
import type { Prisma } from "@prisma/client";
import type { CompletedServiceRecord, ReviewStats, StarRating, VerifiedClient, WorkshopReview } from "@/types/review";

function mapReview(row: {
  id: string;
  workshopId: string;
  cpf: string;
  clientName: string;
  stars: number;
  comment: string;
  serviceLabel: string;
  createdAt: Date;
  updatedAt: Date;
}): WorkshopReview {
  return {
    id: row.id,
    workshopId: row.workshopId,
    cpf: row.cpf,
    clientName: row.clientName,
    stars: row.stars as StarRating,
    comment: row.comment,
    serviceLabel: row.serviceLabel,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function getVerifiedClientFromDb(
  workshopId: string,
  cpf: string
): Promise<VerifiedClient | null> {
  const client = await prisma.crmClient.findUnique({
    where: { workshopId_cpf: { workshopId, cpf } },
  });
  if (!client) return null;
  return {
    cpf: client.cpf,
    name: client.name,
    completedServices: client.completedServices as unknown as CompletedServiceRecord[],
  };
}

function normalizePlate(plate: string) {
  return plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function workshopClientId(workshopId: string, cpf: string) {
  return `cli-${workshopId}-${cpf}`;
}

async function collectVehicleEligibleServices(
  workshopId: string,
  vehicleId: string,
  plate: string
): Promise<CompletedServiceRecord[]> {
  const vehicle = await prisma.crmVehicle.findFirst({ where: { id: vehicleId, workshopId } });
  const fromVehicle = (vehicle?.completedServices ?? []) as unknown as CompletedServiceRecord[];

  const fromOrders = await prisma.crmServiceOrder.findMany({
    where: {
      workshopId,
      status: "concluido",
      OR: [{ vehicleId }, { vehiclePlate: plate }],
    },
  });

  const merged = [...fromVehicle];
  for (const order of fromOrders) {
    if (!merged.some((s) => s.orderId === order.id)) {
      merged.push({
        orderId: order.id,
        service: order.service,
        date: order.date,
        vehicle: order.vehicle,
      });
    }
  }
  return merged;
}

export type VerifyReviewResult =
  | { status: "ready"; client: VerifiedClient; existingReview: WorkshopReview | null }
  | { status: "needs_registration" }
  | { status: "not_eligible"; error: string };

export async function verifyReviewEligibility(input: {
  workshopId: string;
  cpf: string;
  plate?: string;
  name?: string;
  phone?: string;
  birthDate?: string;
}): Promise<VerifyReviewResult> {
  const cpf = normalizeCpf(input.cpf);
  const plate = input.plate ? normalizePlate(input.plate) : "";

  const workshop = await prisma.workshop.findUnique({
    where: { id: input.workshopId },
    select: { vertical: true },
  });
  const ops = getOperationalConfig(workshop?.vertical);

  if (!cpf) {
    return { status: "not_eligible", error: "Informe um CPF válido." };
  }

  if (ops.reviews.requireAssetReference && plate.length < 3) {
    return { status: "not_eligible", error: `Informe CPF e ${ops.reviews.assetReferenceLabel.toLowerCase()} válidos.` };
  }

  if (!(await isDatabaseReachable())) {
    const staticClient = getVerifiedClientStatic(input.workshopId, cpf);
    if (staticClient && staticClient.completedServices.length > 0) {
      const existingReview = await getReviewByCpf(input.workshopId, cpf);
      return { status: "ready", client: staticClient, existingReview };
    }
    return {
      status: "not_eligible",
      error: ops.reviews.requireAssetReference
        ? "Não encontramos serviço concluído para este CPF e referência."
        : "Não encontramos serviço concluído para este CPF.",
    };
  }

  const existingReview = await getReviewByCpf(input.workshopId, cpf);
  let client = await getVerifiedClientFromDb(input.workshopId, cpf);

  if (client && client.completedServices.length > 0) {
    return { status: "ready", client, existingReview };
  }

  if (!ops.reviews.requireAssetReference) {
    const clientByCpf = await prisma.crmClient.findUnique({
      where: { workshopId_cpf: { workshopId: input.workshopId, cpf } },
    });
    const services = (clientByCpf?.completedServices ?? []) as unknown as CompletedServiceRecord[];
    if (services.length === 0) {
      return {
        status: "not_eligible",
        error: "Ainda não há serviço concluído vinculado a este CPF neste negócio.",
      };
    }
    if (!input.name?.trim()) {
      return { status: "needs_registration" };
    }
    if (!input.birthDate?.trim()) {
      return { status: "not_eligible", error: "Informe sua data de nascimento para concluir o cadastro." };
    }
    const birthDate = new Date(input.birthDate);
    if (Number.isNaN(birthDate.getTime())) {
      return { status: "not_eligible", error: "Data de nascimento inválida." };
    }
    const updated = await prisma.crmClient.update({
      where: { workshopId_cpf: { workshopId: input.workshopId, cpf } },
      data: {
        name: input.name.trim(),
        phone: input.phone?.trim() ?? undefined,
        birthDate,
      },
    });
    client = {
      cpf: updated.cpf,
      name: updated.name,
      completedServices: services,
    };
    return { status: "ready", client, existingReview };
  }

  const vehicle = await prisma.crmVehicle.findFirst({
    where: {
      workshopId: input.workshopId,
      OR: [{ referenceKey: plate }, { plate }],
    },
  });

  if (!vehicle) {
    return {
      status: "not_eligible",
      error: `${ops.reviews.assetReferenceLabel} não encontrada neste negócio. Confira a referência do atendimento.`,
    };
  }

  const eligibleServices = await collectVehicleEligibleServices(
    input.workshopId,
    vehicle.id,
    plate
  );

  if (eligibleServices.length === 0) {
    return {
      status: "not_eligible",
      error: "Ainda não há serviço concluído para este veículo nesta oficina.",
    };
  }

  if (!input.name?.trim()) {
    return { status: "needs_registration" };
  }

  if (!input.birthDate?.trim()) {
    return { status: "not_eligible", error: "Informe sua data de nascimento para concluir o cadastro." };
  }

  const birthDate = new Date(input.birthDate);
  if (Number.isNaN(birthDate.getTime())) {
    return { status: "not_eligible", error: "Data de nascimento inválida." };
  }

  const name = input.name.trim();
  const phone = input.phone?.trim() ?? "";

  if (client) {
    const merged = [...client.completedServices];
    for (const service of eligibleServices) {
      if (!merged.some((s) => s.orderId === service.orderId)) merged.push(service);
    }
    const updated = await prisma.crmClient.update({
      where: { workshopId_cpf: { workshopId: input.workshopId, cpf } },
      data: {
        name,
        phone: phone || undefined,
        birthDate,
        completedServices: merged as unknown as Prisma.InputJsonValue,
      },
    });
    await prisma.crmVehicle.update({
      where: { id: vehicle.id },
      data: { clientId: updated.id, completedServices: [] },
    });
    client = {
      cpf: updated.cpf,
      name: updated.name,
      completedServices: merged,
    };
  } else {
    const created = await prisma.crmClient.create({
      data: {
        id: workshopClientId(input.workshopId, cpf),
        workshopId: input.workshopId,
        cpf,
        name,
        phone,
        birthDate,
        completedServices: eligibleServices as unknown as Prisma.InputJsonValue,
      },
    });
    await prisma.crmVehicle.update({
      where: { id: vehicle.id },
      data: { clientId: created.id, completedServices: [] },
    });
    client = {
      cpf: created.cpf,
      name: created.name,
      completedServices: eligibleServices,
    };
  }

  return { status: "ready", client, existingReview };
}

function getVerifiedClientStatic(workshopId: string, cpf: string): VerifiedClient | null {
  return verifiedClientsByWorkshop[workshopId]?.find((c) => c.cpf === cpf) ?? null;
}

export async function getVerifiedClient(
  workshopId: string,
  cpf: string
): Promise<VerifiedClient | null> {
  const normalized = normalizeCpf(cpf);
  if (await isDatabaseReachable()) {
    return getVerifiedClientFromDb(workshopId, normalized);
  }
  return getVerifiedClientStatic(workshopId, normalized);
}

export async function getReviewsForWorkshop(workshopId: string): Promise<WorkshopReview[]> {
  if (!(await isDatabaseReachable())) {
    return seedReviews
      .filter((r) => r.workshopId === workshopId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  const rows = await prisma.review.findMany({
    where: { workshopId, removed: false },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapReview);
}

export async function getAllReviewsForAdmin(): Promise<(WorkshopReview & { removed: boolean })[]> {
  if (!(await isDatabaseReachable())) {
    return seedReviews.map((r) => ({ ...r, removed: false }));
  }

  const rows = await prisma.review.findMany({ orderBy: { updatedAt: "desc" } });
  return rows.map((row) => ({ ...mapReview(row), removed: row.removed }));
}

export async function getReviewStats(
  workshopId: string,
  fallbackAverage = 0,
  fallbackCount = 0
): Promise<ReviewStats> {
  const reviews = await getReviewsForWorkshop(workshopId);
  if (reviews.length === 0) {
    return { average: fallbackAverage, count: fallbackCount };
  }
  const sum = reviews.reduce((acc, r) => acc + r.stars, 0);
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}

export async function getReviewByCpf(
  workshopId: string,
  cpf: string
): Promise<WorkshopReview | null> {
  const normalized = normalizeCpf(cpf);
  if (!(await isDatabaseReachable())) {
    return (
      seedReviews.find((r) => r.workshopId === workshopId && r.cpf === normalized) ?? null
    );
  }

  const row = await prisma.review.findUnique({
    where: { workshopId_cpf: { workshopId, cpf: normalized } },
  });
  if (!row || row.removed) return null;
  return mapReview(row);
}

export async function upsertReview(input: {
  workshopId: string;
  cpf: string;
  stars: StarRating;
  comment: string;
}): Promise<{ ok: true; review: WorkshopReview } | { ok: false; error: string }> {
  const normalized = normalizeCpf(input.cpf);
  const client = await getVerifiedClient(input.workshopId, normalized);

  if (!client || client.completedServices.length === 0) {
    return {
      ok: false,
      error:
        "Só é possível avaliar após um serviço concluído. Informe CPF e placa do veículo atendido.",
    };
  }

  const latestService = [...client.completedServices].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  if (!(await isDatabaseReachable())) {
    return {
      ok: false,
      error: "Banco de dados indisponível. Configure PostgreSQL para salvar avaliações.",
    };
  }

  const now = new Date();
  const row = await prisma.review.upsert({
    where: { workshopId_cpf: { workshopId: input.workshopId, cpf: normalized } },
    create: {
      id: `rev-${Date.now()}`,
      workshopId: input.workshopId,
      cpf: normalized,
      clientName: client.name,
      stars: input.stars,
      comment: input.comment.trim(),
      serviceLabel: latestService.service,
      removed: false,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      stars: input.stars,
      comment: input.comment.trim(),
      serviceLabel: latestService.service,
      removed: false,
      updatedAt: now,
    },
  });

  return { ok: true, review: mapReview(row) };
}

export async function setReviewRemoved(reviewId: string, removed: boolean): Promise<void> {
  if (!(await isDatabaseReachable())) return;
  await prisma.review.updateMany({ where: { id: reviewId }, data: { removed } });
}
