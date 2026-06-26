import { prisma } from "@/lib/db/prisma";

export interface ClassifiedAdRecord {
  id: string;
  workshopId: string | null;
  workshopName: string | null;
  title: string;
  body: string;
  price: number | null;
  contact: string | null;
  category: string;
  images: string[];
  premium: boolean;
  active: boolean;
  createdAt: string;
  expiresAt: string | null;
}

function notExpired(expiresAt: Date | null): boolean {
  return !expiresAt || expiresAt > new Date();
}

export async function listClassifieds(opts?: {
  workshopId?: string;
  activeOnly?: boolean;
  premiumOnly?: boolean;
}): Promise<ClassifiedAdRecord[]> {
  const rows = await prisma.classifiedAd.findMany({
    where: {
      ...(opts?.workshopId ? { workshopId: opts.workshopId } : {}),
      ...(opts?.activeOnly !== false ? { active: true } : {}),
      ...(opts?.premiumOnly ? { premium: true } : {}),
    },
    include: { workshop: { select: { name: true } } },
    orderBy: [{ premium: "desc" }, { createdAt: "desc" }],
  });
  return rows.filter((r) => notExpired(r.expiresAt)).map(mapClassified);
}

export async function listPremiumClassifieds(limit?: number): Promise<ClassifiedAdRecord[]> {
  const rows = await listClassifieds({ activeOnly: true, premiumOnly: true });
  return limit ? rows.slice(0, limit) : rows;
}

export async function createClassified(input: {
  workshopId?: string;
  title: string;
  body: string;
  price?: number;
  contact?: string;
  category?: string;
  images?: string[];
  premium?: boolean;
  expiresAt?: string;
}): Promise<ClassifiedAdRecord> {
  const row = await prisma.classifiedAd.create({
    data: {
      workshopId: input.workshopId ?? null,
      title: input.title.trim(),
      body: input.body.trim(),
      price: input.price ?? null,
      contact: input.contact?.trim() || null,
      category: input.category?.trim() || "geral",
      images: (input.images ?? []) as object,
      premium: input.premium ?? false,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      active: true,
    },
    include: { workshop: { select: { name: true } } },
  });
  return mapClassified(row);
}

export async function updateClassified(
  id: string,
  workshopId: string | undefined,
  input: Partial<{
    title: string;
    body: string;
    price: number;
    contact: string;
    category: string;
    images: string[];
    premium: boolean;
    active: boolean;
  }>,
  opts?: { allowPremium?: boolean }
): Promise<{ ok: true; ad: ClassifiedAdRecord } | { ok: false; error: string }> {
  const existing = await prisma.classifiedAd.findFirst({
    where: { id, ...(workshopId ? { workshopId } : {}) },
  });
  if (!existing) return { ok: false, error: "Anúncio não encontrado." };

  if (input.premium !== undefined && !opts?.allowPremium) {
    return { ok: false, error: "Somente o administrador pode definir anúncio premium no jornal." };
  }

  const row = await prisma.classifiedAd.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.body !== undefined ? { body: input.body.trim() } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.contact !== undefined ? { contact: input.contact.trim() || null } : {}),
      ...(input.category !== undefined ? { category: input.category.trim() } : {}),
      ...(input.images !== undefined ? { images: input.images as object } : {}),
      ...(input.premium !== undefined ? { premium: input.premium } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
    include: { workshop: { select: { name: true } } },
  });
  return { ok: true, ad: mapClassified(row) };
}

export async function deleteClassified(
  id: string,
  workshopId?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await prisma.classifiedAd.deleteMany({
    where: { id, ...(workshopId ? { workshopId } : {}) },
  });
  if (result.count === 0) return { ok: false, error: "Anúncio não encontrado." };
  return { ok: true };
}

function mapClassified(row: {
  id: string;
  workshopId: string | null;
  workshop?: { name: string } | null;
  title: string;
  body: string;
  price: number | null;
  contact: string | null;
  category: string;
  images: unknown;
  premium: boolean;
  active: boolean;
  createdAt: Date;
  expiresAt: Date | null;
}): ClassifiedAdRecord {
  return {
    id: row.id,
    workshopId: row.workshopId,
    workshopName: row.workshop?.name ?? null,
    title: row.title,
    body: row.body,
    price: row.price,
    contact: row.contact,
    category: row.category,
    images: (row.images as string[] | null) ?? [],
    premium: row.premium,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
  };
}

export function formatClassifiedCategory(category: string): string {
  const labels: Record<string, string> = {
    vendas: "Vendas",
    servicos: "Serviços",
    veiculos: "Veículos",
    pecas: "Peças",
    geral: "Geral",
  };
  return labels[category] ?? category;
}
