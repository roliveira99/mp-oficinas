import { platformMechanicsByWorkshop } from "@/data/platform-mechanics";
import { normalizeCpf } from "@/lib/cpf";
import { isDatabaseReachable, prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import type {
  BusinessAssetType,
  FictionalMechanic,
  MechanicAssignee,
  MechanicKind,
  MechanicProductivity,
  ServiceOrderStatus,
  WorkshopClient,
  WorkshopCrmData,
  WorkshopServiceOrder,
  WorkshopVehicle,
} from "@/types/client";
import { getOperationalConfig, formatAssetLabel } from "@/lib/verticals/operational";

import type { CompletedServiceRecord } from "@/types/review";

function clientId(workshopId: string, cpf: string) {
  return `cli-${workshopId}-${cpf}`;
}

function mapClient(row: {
  id: string;
  workshopId: string;
  cpf: string;
  name: string;
  phone: string;
  completedServices: unknown;
  createdAt: Date;
}): WorkshopClient {
  return {
    id: row.id,
    workshopId: row.workshopId,
    cpf: row.cpf,
    name: row.name,
    phone: row.phone,
    completedServices: row.completedServices as CompletedServiceRecord[],
    createdAt: row.createdAt.toISOString(),
  };
}

function normalizeReferenceKey(key: string) {
  return key.trim().toUpperCase().replace(/\s+/g, "");
}

function mapVehicle(row: {
  id: string;
  workshopId: string;
  clientId: string | null;
  assetType?: BusinessAssetType | null;
  referenceKey?: string | null;
  label?: string | null;
  plate: string;
  model: string;
  year?: string | null;
  completedServices?: unknown;
}): WorkshopVehicle {
  const referenceKey = row.referenceKey || row.plate;
  const label = row.label || row.model;
  return {
    id: row.id,
    workshopId: row.workshopId,
    clientId: row.clientId,
    assetType: (row.assetType ?? "vehicle") as BusinessAssetType,
    referenceKey,
    label,
    plate: row.plate || referenceKey,
    model: row.model || label,
    year: row.year ?? undefined,
    completedServices: (row.completedServices ?? []) as CompletedServiceRecord[],
  };
}

function mapOrder(row: {
  id: string;
  workshopId: string;
  clientId: string | null;
  vehicleId: string | null;
  clientName: string;
  clientCpf: string;
  vehicle: string;
  vehiclePlate: string | null;
  service: string;
  status: ServiceOrderStatus;
  date: string;
  value: number;
  mechanicId: string | null;
  mechanicKind: MechanicKind | null;
  mechanicName: string | null;
}): WorkshopServiceOrder {
  return {
    id: row.id,
    workshopId: row.workshopId,
    clientId: row.clientId,
    vehicleId: row.vehicleId,
    clientName: row.clientName,
    clientCpf: row.clientCpf,
    vehicle: row.vehicle,
    vehiclePlate: row.vehiclePlate ?? undefined,
    service: row.service,
    status: row.status,
    date: row.date,
    value: row.value,
    mechanicId: row.mechanicId ?? undefined,
    mechanicKind: row.mechanicKind ?? undefined,
    mechanicName: row.mechanicName ?? undefined,
  };
}

function mapFictional(row: {
  id: string;
  workshopId: string;
  name: string;
  specialty: string | null;
  notes: string | null;
  active: boolean;
  createdAt: Date;
}): FictionalMechanic {
  return {
    id: row.id,
    workshopId: row.workshopId,
    name: row.name,
    specialty: row.specialty ?? undefined,
    notes: row.notes ?? undefined,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getCrmData(workshopId: string): Promise<WorkshopCrmData> {
  if (!(await isDatabaseReachable())) {
    return { clients: [], vehicles: [], orders: [], fictionalMechanics: [] };
  }

  const [clients, vehicles, orders, fictionalMechanics] = await Promise.all([
    prisma.crmClient.findMany({ where: { workshopId }, orderBy: { name: "asc" } }),
    prisma.crmVehicle.findMany({ where: { workshopId } }),
    prisma.crmServiceOrder.findMany({
      where: { workshopId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.fictionalMechanic.findMany({ where: { workshopId }, orderBy: { name: "asc" } }),
  ]);

  return {
    clients: clients.map(mapClient),
    vehicles: vehicles.map(mapVehicle),
    orders: orders.map(mapOrder),
    fictionalMechanics: fictionalMechanics.map(mapFictional),
  };
}

export function getPlatformMechanics(workshopId: string): MechanicAssignee[] {
  return (platformMechanicsByWorkshop[workshopId] ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    kind: "platform" as const,
    specialty: m.specialty,
  }));
}

export async function getAllMechanicAssignees(
  workshopId: string,
  activeFictionalOnly = true
): Promise<MechanicAssignee[]> {
  const data = await getCrmData(workshopId);
  const platform = getPlatformMechanics(workshopId);
  const fictional = data.fictionalMechanics
    .filter((m) => !activeFictionalOnly || m.active)
    .map((m) => ({
      id: m.id,
      name: m.name,
      kind: "fictional" as const,
      specialty: m.specialty,
    }));
  return [...platform, ...fictional];
}

async function resolveAssignee(
  workshopId: string,
  mechanicId: string,
  kind: MechanicKind
): Promise<MechanicAssignee | null> {
  const all = await getAllMechanicAssignees(workshopId, false);
  return all.find((a) => a.id === mechanicId && a.kind === kind) ?? null;
}

export async function addClient(
  workshopId: string,
  input: { name: string; phone: string; cpf: string }
): Promise<{ ok: true; client: WorkshopClient } | { ok: false; error: string }> {
  const cpf = normalizeCpf(input.cpf);
  const existing = await prisma.crmClient.findUnique({
    where: { workshopId_cpf: { workshopId, cpf } },
  });
  if (existing) return { ok: false, error: "Já existe um cliente com este CPF nesta oficina." };

  const row = await prisma.crmClient.create({
    data: {
      id: clientId(workshopId, cpf),
      workshopId,
      cpf,
      name: input.name.trim(),
      phone: input.phone.trim(),
      completedServices: [],
    },
  });
  return { ok: true, client: mapClient(row) };
}

export async function addAsset(
  workshopId: string,
  input: {
    referenceKey: string;
    label: string;
    assetType?: BusinessAssetType;
    model?: string;
    year?: string;
    clientId?: string;
  }
): Promise<{ ok: true; vehicle: WorkshopVehicle } | { ok: false; error: string }> {
  const referenceKey = normalizeReferenceKey(input.referenceKey);
  const label = input.label.trim();
  const model = (input.model ?? label).trim();
  const year = input.year?.trim() || null;
  const assetType = input.assetType ?? "generic";

  if (!referenceKey || !label) {
    return { ok: false, error: "Informe referência e descrição." };
  }

  const dup = await prisma.crmVehicle.findUnique({
    where: { workshopId_referenceKey: { workshopId, referenceKey } },
  });
  if (dup) return { ok: false, error: "Já existe um registro com esta referência." };

  if (input.clientId) {
    const client = await prisma.crmClient.findFirst({
      where: { id: input.clientId, workshopId },
    });
    if (!client) return { ok: false, error: "Cliente informado não encontrado." };
  }

  const plate = assetType === "vehicle" ? referenceKey : referenceKey.slice(0, 12);
  const row = await prisma.crmVehicle.create({
    data: {
      id: `veh-${Date.now()}`,
      workshopId,
      clientId: input.clientId ?? null,
      assetType,
      referenceKey,
      label,
      plate,
      model,
      year,
      completedServices: [],
    },
  });
  return { ok: true, vehicle: mapVehicle(row) };
}

export async function addVehicle(
  workshopId: string,
  input: { plate: string; model: string; year?: string; clientId?: string }
): Promise<{ ok: true; vehicle: WorkshopVehicle } | { ok: false; error: string }> {
  const plate = normalizeReferenceKey(input.plate);
  const model = input.model.trim();
  if (!plate || !model) {
    return { ok: false, error: "Informe placa e modelo do veículo." };
  }

  return addAsset(workshopId, {
    referenceKey: plate,
    label: model,
    model,
    year: input.year,
    clientId: input.clientId,
    assetType: "vehicle",
  });
}

export async function linkVehicleToClient(
  workshopId: string,
  vehicleId: string,
  clientId: string
): Promise<{ ok: true; vehicle: WorkshopVehicle } | { ok: false; error: string }> {
  const [vehicle, client] = await Promise.all([
    prisma.crmVehicle.findFirst({ where: { id: vehicleId, workshopId } }),
    prisma.crmClient.findFirst({ where: { id: clientId, workshopId } }),
  ]);
  if (!vehicle) return { ok: false, error: "Veículo não encontrado." };
  if (!client) return { ok: false, error: "Cliente não encontrado." };

  const row = await prisma.crmVehicle.update({
    where: { id: vehicleId },
    data: { clientId },
  });
  return { ok: true, vehicle: mapVehicle(row) };
}

export async function unlinkVehicleFromClient(
  workshopId: string,
  vehicleId: string
): Promise<{ ok: true; vehicle: WorkshopVehicle } | { ok: false; error: string }> {
  const vehicle = await prisma.crmVehicle.findFirst({ where: { id: vehicleId, workshopId } });
  if (!vehicle) return { ok: false, error: "Veículo não encontrado." };

  const row = await prisma.crmVehicle.update({
    where: { id: vehicleId },
    data: { clientId: null },
  });
  return { ok: true, vehicle: mapVehicle(row) };
}

export async function createOrder(
  workshopId: string,
  input: {
    vehicleId?: string;
    service: string;
    value: number;
    mechanicId: string;
    mechanicKind: MechanicKind;
    clientId?: string;
    status?: ServiceOrderStatus;
    lineItems?: import("@/types/document-line").DocumentLineItem[];
    paymentMethods?: string[];
  }
): Promise<{ ok: true; order: WorkshopServiceOrder } | { ok: false; error: string }> {
  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
    select: { vertical: true },
  });
  const ops = getOperationalConfig(workshop?.vertical);

  let vehicle: Awaited<ReturnType<typeof prisma.crmVehicle.findFirst>> = null;
  if (input.vehicleId) {
    vehicle = await prisma.crmVehicle.findFirst({
      where: { id: input.vehicleId, workshopId },
    });
    if (!vehicle) {
      return { ok: false, error: `${ops.assets.singularLabel} não encontrado. Cadastre antes do orçamento.` };
    }
  } else if (ops.assets.requiredForBudget) {
    return { ok: false, error: `Selecione um ${ops.assets.singularLabel.toLowerCase()} para o orçamento.` };
  }

  const assignee = await resolveAssignee(workshopId, input.mechanicId, input.mechanicKind);
  if (!assignee) return { ok: false, error: "Selecione quem executará o serviço." };

  if (input.mechanicKind === "fictional") {
    const fic = await prisma.fictionalMechanic.findFirst({
      where: { id: input.mechanicId, workshopId, active: true },
    });
    if (!fic) return { ok: false, error: "Este perfil fictício está inativo." };
  }

  let client = input.clientId
    ? await prisma.crmClient.findFirst({ where: { id: input.clientId, workshopId } })
    : vehicle?.clientId
      ? await prisma.crmClient.findFirst({ where: { id: vehicle.clientId, workshopId } })
      : null;

  if (input.clientId && !client) {
    return { ok: false, error: "Cliente informado não encontrado." };
  }

  const vehicleLabel = vehicle ? formatAssetLabel(mapVehicle(vehicle)) : "";
  const row = await prisma.crmServiceOrder.create({
    data: {
      id: `OS-${Date.now().toString().slice(-6)}`,
      workshopId,
      clientId: client?.id ?? null,
      vehicleId: vehicle?.id ?? null,
      clientName: client?.name ?? "",
      clientCpf: client?.cpf ?? "",
      vehicle: vehicleLabel,
      vehiclePlate: vehicle?.referenceKey ?? vehicle?.plate ?? null,
      service: input.service.trim(),
      status: input.status ?? "pendente",
      date: new Date().toISOString().split("T")[0],
      value: input.value,
      lineItems: input.lineItems ? (input.lineItems as object) : undefined,
      paymentMethods: input.paymentMethods ? (input.paymentMethods as object) : undefined,
      mechanicId: assignee.id,
      mechanicKind: assignee.kind,
      mechanicName: assignee.name,
    },
  });
  return { ok: true, order: mapOrder(row) };
}

export async function completeOrder(
  workshopId: string,
  orderId: string
): Promise<{ ok: true; order: WorkshopServiceOrder } | { ok: false; error: string }> {
  const order = await prisma.crmServiceOrder.findFirst({ where: { id: orderId, workshopId } });
  if (!order) return { ok: false, error: "Ordem de serviço não encontrada." };
  if (order.status === "concluido") return { ok: true, order: mapOrder(order) };

  const record: CompletedServiceRecord = {
    orderId: order.id,
    service: order.service,
    date: order.date,
    vehicle: order.vehicle,
  };

  const client = order.clientId
    ? await prisma.crmClient.findFirst({ where: { id: order.clientId, workshopId } })
    : null;

  const vehicle = order.vehicleId
    ? await prisma.crmVehicle.findFirst({ where: { id: order.vehicleId, workshopId } })
    : order.vehiclePlate
      ? await prisma.crmVehicle.findFirst({
          where: {
            workshopId,
            OR: [{ referenceKey: order.vehiclePlate }, { plate: order.vehiclePlate }],
          },
        })
      : null;

  if (!client && !vehicle) {
    if (order.clientName || order.clientCpf) {
      const [updatedOrder] = await prisma.$transaction([
        prisma.crmServiceOrder.update({
          where: { id: orderId },
          data: { status: "concluido" },
        }),
      ]);
      return { ok: true, order: mapOrder(updatedOrder) };
    }
    return { ok: false, error: "Registro da ordem não encontrado no cadastro." };
  }

  if (client) {
    const completed = client.completedServices as unknown as CompletedServiceRecord[];
    if (!completed.some((s) => s.orderId === order.id)) {
      completed.push(record);
    }

    const [updatedOrder] = await prisma.$transaction([
      prisma.crmServiceOrder.update({
        where: { id: orderId },
        data: { status: "concluido" },
      }),
      prisma.crmClient.update({
        where: { id: client.id },
        data: { completedServices: completed as unknown as Prisma.InputJsonValue },
      }),
    ]);

    return { ok: true, order: mapOrder(updatedOrder) };
  }

  const vehicleCompleted = (vehicle!.completedServices ?? []) as unknown as CompletedServiceRecord[];
  if (!vehicleCompleted.some((s) => s.orderId === order.id)) {
    vehicleCompleted.push(record);
  }

  const [updatedOrder] = await prisma.$transaction([
    prisma.crmServiceOrder.update({
      where: { id: orderId },
      data: { status: "concluido" },
    }),
    prisma.crmVehicle.update({
      where: { id: vehicle!.id },
      data: { completedServices: vehicleCompleted as unknown as Prisma.InputJsonValue },
    }),
  ]);

  return { ok: true, order: mapOrder(updatedOrder) };
}

export async function updateOrderStatus(
  workshopId: string,
  orderId: string,
  status: ServiceOrderStatus
): Promise<{ ok: true; order: WorkshopServiceOrder } | { ok: false; error: string }> {
  if (status === "concluido") return completeOrder(workshopId, orderId);

  const row = await prisma.crmServiceOrder.updateMany({
    where: { id: orderId, workshopId },
    data: { status },
  });
  if (row.count === 0) return { ok: false, error: "Ordem de serviço não encontrada." };

  const order = await prisma.crmServiceOrder.findUniqueOrThrow({ where: { id: orderId } });
  return { ok: true, order: mapOrder(order) };
}

export async function assignMechanicToOrder(
  workshopId: string,
  orderId: string,
  mechanicId: string,
  kind: MechanicKind
): Promise<{ ok: true; order: WorkshopServiceOrder } | { ok: false; error: string }> {
  const assignee = await resolveAssignee(workshopId, mechanicId, kind);
  if (!assignee) return { ok: false, error: "Mecânico não encontrado." };

  const result = await prisma.crmServiceOrder.updateMany({
    where: { id: orderId, workshopId },
    data: {
      mechanicId: assignee.id,
      mechanicKind: assignee.kind,
      mechanicName: assignee.name,
    },
  });
  if (result.count === 0) return { ok: false, error: "Ordem de serviço não encontrada." };

  const order = await prisma.crmServiceOrder.findUniqueOrThrow({ where: { id: orderId } });
  return { ok: true, order: mapOrder(order) };
}

export async function addFictionalMechanic(
  workshopId: string,
  input: { name: string; specialty?: string; notes?: string }
): Promise<{ ok: true; mechanic: FictionalMechanic } | { ok: false; error: string }> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Informe o nome do funcionário." };

  const dup = await prisma.fictionalMechanic.findFirst({
    where: { workshopId, name: { equals: name, mode: "insensitive" } },
  });
  if (dup) return { ok: false, error: "Já existe um perfil fictício com este nome." };

  const row = await prisma.fictionalMechanic.create({
    data: {
      id: `fic-${Date.now()}`,
      workshopId,
      name,
      specialty: input.specialty?.trim() || null,
      notes: input.notes?.trim() || null,
    },
  });
  return { ok: true, mechanic: mapFictional(row) };
}

export async function setFictionalMechanicActive(
  workshopId: string,
  mechanicId: string,
  active: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await prisma.fictionalMechanic.updateMany({
    where: { id: mechanicId, workshopId },
    data: { active },
  });
  if (result.count === 0) return { ok: false, error: "Perfil não encontrado." };
  return { ok: true };
}

export async function getMechanicProductivity(workshopId: string): Promise<MechanicProductivity[]> {
  const orders = (await getCrmData(workshopId)).orders;
  const assignees = await getAllMechanicAssignees(workshopId, false);
  const byKey = new Map<string, MechanicProductivity>();

  for (const assignee of assignees) {
    byKey.set(`${assignee.kind}:${assignee.id}`, {
      assignee,
      totalOrders: 0,
      completedOrders: 0,
      inProgressOrders: 0,
      totalValue: 0,
      completedValue: 0,
    });
  }

  for (const order of orders) {
    if (!order.mechanicId || !order.mechanicKind) continue;
    const key = `${order.mechanicKind}:${order.mechanicId}`;
    let stats = byKey.get(key);
    if (!stats) {
      stats = {
        assignee: {
          id: order.mechanicId,
          name: order.mechanicName ?? "—",
          kind: order.mechanicKind,
        },
        totalOrders: 0,
        completedOrders: 0,
        inProgressOrders: 0,
        totalValue: 0,
        completedValue: 0,
      };
      byKey.set(key, stats);
    }
    stats.totalOrders += 1;
    stats.totalValue += order.value;
    if (order.status === "concluido") {
      stats.completedOrders += 1;
      stats.completedValue += order.value;
    }
    if (order.status === "em_andamento" || order.status === "pendente") {
      stats.inProgressOrders += 1;
    }
  }

  return Array.from(byKey.values()).sort((a, b) => b.completedOrders - a.completedOrders);
}
