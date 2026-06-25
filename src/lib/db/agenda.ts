import type { AgendaRequest } from "@/types/workshop";
import { isDatabaseReachable, prisma } from "@/lib/db/prisma";

function mapAgenda(row: {
  id: string;
  workshopId: string;
  clientName: string;
  clientPhone: string;
  vehicle: string | null;
  preferredDate: string;
  preferredTime: string;
  proposedDate: string | null;
  proposedTime: string | null;
  service: string;
  status: string;
  createdAt: Date;
}): AgendaRequest {
  return {
    id: row.id,
    workshopId: row.workshopId,
    clientName: row.clientName,
    clientPhone: row.clientPhone,
    vehicle: row.vehicle ?? undefined,
    preferredDate: row.preferredDate,
    preferredTime: row.preferredTime,
    proposedDate: row.proposedDate ?? undefined,
    proposedTime: row.proposedTime ?? undefined,
    service: row.service,
    status: row.status as AgendaRequest["status"],
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createAgendaRequest(
  input: Omit<AgendaRequest, "id" | "status" | "createdAt" | "proposedDate" | "proposedTime">
): Promise<AgendaRequest> {
  if (!(await isDatabaseReachable())) {
    throw new Error("Banco de dados indisponível");
  }

  const row = await prisma.agendaRequest.create({
    data: {
      id: `ag-${Date.now()}`,
      workshopId: input.workshopId,
      clientName: input.clientName,
      clientPhone: input.clientPhone,
      vehicle: input.vehicle ?? null,
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime,
      service: input.service,
      status: "pendente",
    },
  });

  return mapAgenda(row);
}

export async function getAgendaRequests(workshopId?: string): Promise<AgendaRequest[]> {
  if (!(await isDatabaseReachable())) return [];

  const rows = await prisma.agendaRequest.findMany({
    where: workshopId ? { workshopId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return rows.map(mapAgenda);
}

export async function getAgendaRequest(
  workshopId: string,
  id: string
): Promise<AgendaRequest | null> {
  if (!(await isDatabaseReachable())) return null;
  const row = await prisma.agendaRequest.findFirst({ where: { id, workshopId } });
  return row ? mapAgenda(row) : null;
}

export async function updateAgendaStatus(
  workshopId: string,
  id: string,
  status: AgendaRequest["status"]
): Promise<boolean> {
  if (!(await isDatabaseReachable())) return false;
  const result = await prisma.agendaRequest.updateMany({
    where: { id, workshopId },
    data: {
      status,
      ...(status === "aprovado" ? { proposedDate: null, proposedTime: null } : {}),
    },
  });
  return result.count > 0;
}

export async function proposeAgendaChange(
  workshopId: string,
  id: string,
  proposedDate: string,
  proposedTime: string
): Promise<AgendaRequest | null> {
  if (!(await isDatabaseReachable())) return null;
  const existing = await prisma.agendaRequest.findFirst({ where: { id, workshopId } });
  if (!existing || existing.status === "recusado" || existing.status === "pendente") return null;

  const row = await prisma.agendaRequest.update({
    where: { id },
    data: {
      proposedDate,
      proposedTime,
      status: "alteracao_pendente",
    },
  });
  return mapAgenda(row);
}

export async function confirmAgendaChange(workshopId: string, id: string): Promise<AgendaRequest | null> {
  if (!(await isDatabaseReachable())) return null;
  const existing = await prisma.agendaRequest.findFirst({ where: { id, workshopId } });
  if (!existing?.proposedDate || !existing.proposedTime) return null;

  const row = await prisma.agendaRequest.update({
    where: { id },
    data: {
      preferredDate: existing.proposedDate,
      preferredTime: existing.proposedTime,
      proposedDate: null,
      proposedTime: null,
      status: "aprovado",
    },
  });
  return mapAgenda(row);
}

export async function cancelAgendaChange(workshopId: string, id: string): Promise<AgendaRequest | null> {
  if (!(await isDatabaseReachable())) return null;
  const existing = await prisma.agendaRequest.findFirst({ where: { id, workshopId } });
  if (!existing) return null;

  const row = await prisma.agendaRequest.update({
    where: { id },
    data: {
      proposedDate: null,
      proposedTime: null,
      status: existing.status === "alteracao_pendente" ? "aprovado" : existing.status,
    },
  });
  return mapAgenda(row);
}
