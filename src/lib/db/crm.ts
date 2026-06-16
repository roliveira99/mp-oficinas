import { platformMechanicsByWorkshop } from "@/data/platform-mechanics";
import { normalizeCpf } from "@/lib/cpf";
import { isDatabaseReachable, prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import type {
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

function mapVehicle(row: {
  id: string;
  workshopId: string;
  clientId: string | null;
  plate: string;
  model: string;
  completedServices?: unknown;
}): WorkshopVehicle {
  return {
    id: row.id,
    workshopId: row.workshopId,
    clientId: row.clientId,
    plate: row.plate,
    model: row.model,
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

export async function addVehicle(
  workshopId: string,
  input: { plate: string; model: string; clientId?: string }
): Promise<{ ok: true; vehicle: WorkshopVehicle } | { ok: false; error: string }> {
  const plate = input.plate.trim().toUpperCase();
  const model = input.model.trim();
  if (!plate || !model) {
    return { ok: false, error: "Informe placa e modelo do veículo." };
  }

  const dup = await prisma.crmVehicle.findUnique({
    where: { workshopId_plate: { workshopId, plate } },
  });
  if (dup) return { ok: false, error: "Já existe um veículo com esta placa." };

  if (input.clientId) {
    const client = await prisma.crmClient.findFirst({
      where: { id: input.clientId, workshopId },
    });
    if (!client) return { ok: false, error: "Cliente informado não encontrado." };
  }

  const row = await prisma.crmVehicle.create({
    data: {
      id: `veh-${Date.now()}`,
      workshopId,
      clientId: input.clientId ?? null,
      plate,
      model,
      completedServices: [],
    },
  });
  return { ok: true, vehicle: mapVehicle(row) };
}

export async function createOrder(
  workshopId: string,
  input: {
    vehicleId: string;
    service: string;
    value: number;
    mechanicId: string;
    mechanicKind: MechanicKind;
    clientId?: string;
    status?: ServiceOrderStatus;
  }
): Promise<{ ok: true; order: WorkshopServiceOrder } | { ok: false; error: string }> {
  const vehicle = await prisma.crmVehicle.findFirst({
    where: { id: input.vehicleId, workshopId },
  });
  if (!vehicle) return { ok: false, error: "Veículo não encontrado. Cadastre a placa antes do orçamento." };

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
    : vehicle.clientId
      ? await prisma.crmClient.findFirst({ where: { id: vehicle.clientId, workshopId } })
      : null;

  if (input.clientId && !client) {
    return { ok: false, error: "Cliente informado não encontrado." };
  }

  const row = await prisma.crmServiceOrder.create({
    data: {
      id: `OS-${Date.now().toString().slice(-6)}`,
      workshopId,
      clientId: client?.id ?? null,
      vehicleId: vehicle.id,
      clientName: client?.name ?? "",
      clientCpf: client?.cpf ?? "",
      vehicle: vehicle.model,
      vehiclePlate: vehicle.plate,
      service: input.service.trim(),
      status: input.status ?? "pendente",
      date: new Date().toISOString().split("T")[0],
      value: input.value,
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
          where: { workshopId, plate: order.vehiclePlate },
        })
      : null;

  if (!client && !vehicle) {
    return { ok: false, error: "Veículo da ordem não encontrado no cadastro." };
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
