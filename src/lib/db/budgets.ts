import { prisma } from "@/lib/db/prisma";
import { getOperationalConfig } from "@/lib/verticals/operational";
import type { BudgetStatus, MechanicKind } from "@prisma/client";
import type { BudgetRecord } from "@/types/budget";
import type { DocumentLineItem } from "@/types/document-line";

export type { BudgetRecord };

function mapBudget(row: {
  id: string;
  workshopId: string;
  vehicleId: string | null;
  status: BudgetStatus;
  lineItems: unknown;
  paymentMethods: unknown;
  subtotal: number;
  total: number;
  notes: string | null;
  mechanicId: string | null;
  mechanicKind: MechanicKind | null;
  mechanicName: string | null;
  approvedAt: Date | null;
  sentAt: Date | null;
  serviceNoteId: string | null;
  createdById: string | null;
  createdAt: Date;
}): BudgetRecord {
  return {
    id: row.id,
    workshopId: row.workshopId,
    vehicleId: row.vehicleId,
    status: row.status,
    lineItems: (row.lineItems ?? []) as DocumentLineItem[],
    paymentMethods: (row.paymentMethods ?? []) as string[],
    subtotal: row.subtotal,
    total: row.total,
    notes: row.notes,
    mechanicId: row.mechanicId,
    mechanicKind: row.mechanicKind,
    mechanicName: row.mechanicName,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    sentAt: row.sentAt?.toISOString() ?? null,
    serviceNoteId: row.serviceNoteId,
    createdAt: row.createdAt.toISOString(),
    createdById: row.createdById,
  };
}

export async function listBudgets(
  workshopId: string,
  status?: BudgetStatus | BudgetStatus[]
): Promise<BudgetRecord[]> {
  const statuses = status ? (Array.isArray(status) ? status : [status]) : undefined;
  const rows = await prisma.workshopBudget.findMany({
    where: { workshopId, ...(statuses ? { status: { in: statuses } } : {}) },
    orderBy: { createdAt: "desc" },
  });
  const vehicleIds = rows.map((r) => r.vehicleId).filter(Boolean) as string[];
  const vehicles = vehicleIds.length
    ? await prisma.crmVehicle.findMany({
        where: { workshopId, id: { in: vehicleIds } },
      })
    : [];
  return rows.map((row) => {
    const b = mapBudget(row);
    const v = row.vehicleId ? vehicles.find((x) => x.id === row.vehicleId) : undefined;
    return {
      ...b,
      vehiclePlate: v?.referenceKey ?? v?.plate,
      vehicleModel: v?.label ?? v?.model,
      vehicleYear: v?.year ?? undefined,
    };
  });
}

export async function createBudget(
  workshopId: string,
  input: {
    vehicleId?: string | null;
    lineItems: DocumentLineItem[];
    paymentMethods?: string[];
    mechanicId?: string;
    mechanicKind?: MechanicKind;
    mechanicName?: string;
    notes?: string;
    createdById?: string;
    status?: BudgetStatus;
  }
): Promise<{ ok: true; budget: BudgetRecord } | { ok: false; error: string }> {
  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
    select: { vertical: true },
  });
  const ops = getOperationalConfig(workshop?.vertical);

  if (ops.assets.requiredForBudget && !input.vehicleId) {
    return { ok: false, error: `Selecione um ${ops.assets.singularLabel.toLowerCase()}.` };
  }

  if (input.vehicleId) {
    const vehicle = await prisma.crmVehicle.findFirst({ where: { id: input.vehicleId, workshopId } });
    if (!vehicle) return { ok: false, error: `${ops.assets.singularLabel} não encontrado.` };
  }

  if (input.lineItems.length === 0) return { ok: false, error: "Adicione itens ao orçamento." };

  const subtotal = input.lineItems.reduce((s, l) => s + l.total, 0);
  const row = await prisma.workshopBudget.create({
    data: {
      workshopId,
      vehicleId: input.vehicleId ?? null,
      status: input.status ?? "aguardando_aprovacao",
      lineItems: input.lineItems as object,
      paymentMethods: (input.paymentMethods ?? []) as object,
      subtotal,
      total: subtotal,
      notes: input.notes?.trim() || null,
      mechanicId: input.mechanicId ?? null,
      mechanicKind: input.mechanicKind ?? null,
      mechanicName: input.mechanicName ?? null,
      createdById: input.createdById ?? null,
    },
  });
  return { ok: true, budget: mapBudget(row) };
}

export async function updateBudget(
  workshopId: string,
  budgetId: string,
  input: {
    lineItems?: DocumentLineItem[];
    paymentMethods?: string[];
    notes?: string;
    status?: BudgetStatus;
    mechanicId?: string;
    mechanicKind?: MechanicKind;
    mechanicName?: string;
  }
): Promise<{ ok: true; budget: BudgetRecord } | { ok: false; error: string }> {
  const existing = await prisma.workshopBudget.findFirst({ where: { id: budgetId, workshopId } });
  if (!existing) return { ok: false, error: "Orçamento não encontrado." };
  if (existing.status === "convertido") return { ok: false, error: "Orçamento já convertido em nota." };

  const lineItems = input.lineItems ?? (existing.lineItems as unknown as DocumentLineItem[]);
  const subtotal = lineItems.reduce((s, l) => s + l.total, 0);

  const row = await prisma.workshopBudget.update({
    where: { id: budgetId },
    data: {
      ...(input.lineItems ? { lineItems: lineItems as object, subtotal, total: subtotal } : {}),
      ...(input.paymentMethods ? { paymentMethods: input.paymentMethods as object } : {}),
      ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {}),
      ...(input.mechanicId !== undefined ? { mechanicId: input.mechanicId || null } : {}),
      ...(input.mechanicKind !== undefined ? { mechanicKind: input.mechanicKind ?? null } : {}),
      ...(input.mechanicName !== undefined ? { mechanicName: input.mechanicName ?? null } : {}),
      ...(input.status ? { status: input.status, ...(input.status === "aprovado" ? { approvedAt: new Date() } : {}) } : {}),
    },
  });
  return { ok: true, budget: mapBudget(row) };
}

export async function markBudgetSent(workshopId: string, budgetId: string) {
  const row = await prisma.workshopBudget.updateMany({
    where: { id: budgetId, workshopId },
    data: { sentAt: new Date(), status: "aguardando_aprovacao" },
  });
  return row.count > 0;
}

export async function approveBudget(workshopId: string, budgetId: string) {
  return updateBudget(workshopId, budgetId, { status: "aprovado" });
}

export async function rejectBudget(workshopId: string, budgetId: string) {
  return updateBudget(workshopId, budgetId, { status: "rejeitado" });
}
