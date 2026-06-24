import { migrateStorageKey, storageKey } from "@/lib/brand";
import { platformMechanicsByWorkshop } from "@/data/platform-mechanics";
import { verifiedClientsByWorkshop } from "@/data/verified-clients";
import { normalizeCpf } from "@/lib/cpf";
import type {
  FictionalMechanic,
  MechanicAssignee,
  MechanicKind,
  MechanicProductivity,
  WorkshopClient,
  WorkshopCrmData,
  WorkshopServiceOrder,
  WorkshopVehicle,
} from "@/types/client";
import type { CompletedServiceRecord, VerifiedClient } from "@/types/review";

const CRM_KEY = storageKey("crm");

function seedFictionalMechanics(workshopId: string): FictionalMechanic[] {
  if (workshopId !== "1") return [];
  return [
    {
      id: "fic-lucas",
      workshopId,
      name: "Lucas Ferreira",
      specialty: "Suspensão e freios",
      notes: "Sem e-mail — produção lançada pela gerência",
      active: true,
      createdAt: "2026-01-10T12:00:00.000Z",
    },
    {
      id: "fic-ze",
      workshopId,
      name: "José (Zé) Motorista",
      specialty: "Motor e câmbio",
      notes: "Funcionário externo, sem acesso ao sistema",
      active: true,
      createdAt: "2026-03-05T12:00:00.000Z",
    },
  ];
}

function seedCrmForWorkshop(workshopId: string): WorkshopCrmData {
  const seeds = verifiedClientsByWorkshop[workshopId] ?? [];
  const clients: WorkshopClient[] = seeds.map((s) => ({
    id: `cli-${s.cpf}`,
    workshopId,
    name: s.name,
    phone:
      s.cpf === "11144477735"
        ? "(11) 98765-4321"
        : s.cpf === "39053344705"
          ? "(11) 97654-3210"
          : s.cpf === "52998224725"
            ? "(11) 96543-2109"
            : "",
    cpf: s.cpf,
    completedServices: [...s.completedServices],
    createdAt: new Date().toISOString(),
  }));

  const vehicles: WorkshopVehicle[] = [];
  const orders: WorkshopServiceOrder[] = [];
  const fictionalMechanics = seedFictionalMechanics(workshopId);

  if (workshopId === "1") {
    vehicles.push(
      { id: "veh-1", workshopId, clientId: "cli-11144477735", assetType: "vehicle", referenceKey: "ABC1D23", label: "Honda Civic 2020", plate: "ABC-1D23", model: "Honda Civic 2020" },
      { id: "veh-2", workshopId, clientId: "cli-39053344705", assetType: "vehicle", referenceKey: "DEF4G56", label: "Toyota Corolla 2019", plate: "DEF-4G56", model: "Toyota Corolla 2019" },
      { id: "veh-3", workshopId, clientId: "cli-52998224725", assetType: "vehicle", referenceKey: "GHI7J89", label: "VW Gol 2018", plate: "GHI-7J89", model: "VW Gol 2018" }
    );
    orders.push(
      {
        id: "OS-001",
        workshopId,
        clientId: "cli-11144477735",
        clientName: "Carlos Mendes",
        clientCpf: "11144477735",
        vehicle: "Honda Civic 2020",
        vehiclePlate: "ABC-1D23",
        service: "Troca de óleo + filtros",
        status: "concluido",
        date: "2026-06-15",
        value: 280,
        mechanicId: "platform-pedro",
        mechanicKind: "platform",
        mechanicName: "Pedro Oliveira",
      },
      {
        id: "OS-002",
        workshopId,
        clientId: "cli-39053344705",
        clientName: "Ana Paula Ribeiro",
        clientCpf: "39053344705",
        vehicle: "Toyota Corolla 2019",
        vehiclePlate: "DEF-4G56",
        service: "Alinhamento e balanceamento",
        status: "em_andamento",
        date: "2026-06-15",
        value: 150,
        mechanicId: "platform-pedro",
        mechanicKind: "platform",
        mechanicName: "Pedro Oliveira",
      },
      {
        id: "OS-003",
        workshopId,
        clientId: "cli-52998224725",
        clientName: "Roberto Lima",
        clientCpf: "52998224725",
        vehicle: "VW Gol 2018",
        vehiclePlate: "GHI-7J89",
        service: "Revisão dos freios",
        status: "pendente",
        date: "2026-06-15",
        value: 420,
        mechanicId: "fic-lucas",
        mechanicKind: "fictional",
        mechanicName: "Lucas Ferreira",
      }
    );
  }

  return { clients, vehicles, orders, fictionalMechanics };
}

function migrateCrmData(data: WorkshopCrmData, workshopId: string): WorkshopCrmData {
  const fictionalMechanics = data.fictionalMechanics?.length
    ? data.fictionalMechanics
    : seedFictionalMechanics(workshopId);

  const orders = data.orders.map((order) => {
    if (order.mechanicId && order.mechanicKind) return order;
    const name = order.mechanicName ?? "";
    const platform = (platformMechanicsByWorkshop[workshopId] ?? []).find((m) => m.name === name);
    if (platform) {
      return { ...order, mechanicId: platform.id, mechanicKind: "platform" as MechanicKind };
    }
    const fictional = fictionalMechanics.find((m) => m.name === name);
    if (fictional) {
      return { ...order, mechanicId: fictional.id, mechanicKind: "fictional" as MechanicKind };
    }
    return order;
  });

  return { ...data, fictionalMechanics, orders };
}

function readAllCrm(): Record<string, WorkshopCrmData> {
  if (typeof window === "undefined") return {};
  migrateStorageKey("crm");
  const raw = localStorage.getItem(CRM_KEY);
  return raw ? (JSON.parse(raw) as Record<string, WorkshopCrmData>) : {};
}

function writeAllCrm(data: Record<string, WorkshopCrmData>) {
  localStorage.setItem(CRM_KEY, JSON.stringify(data));
}

export function getCrmData(workshopId: string): WorkshopCrmData {
  const all = readAllCrm();
  if (!all[workshopId]) {
    all[workshopId] = seedCrmForWorkshop(workshopId);
    writeAllCrm(all);
    return all[workshopId];
  }
  const migrated = migrateCrmData(all[workshopId], workshopId);
  if (JSON.stringify(migrated) !== JSON.stringify(all[workshopId])) {
    all[workshopId] = migrated;
    writeAllCrm(all);
  }
  return migrated;
}

function saveCrmData(workshopId: string, data: WorkshopCrmData) {
  const all = readAllCrm();
  all[workshopId] = data;
  writeAllCrm(all);
}

export function getClients(workshopId: string): WorkshopClient[] {
  return getCrmData(workshopId).clients;
}

export function getVehicles(workshopId: string): WorkshopVehicle[] {
  return getCrmData(workshopId).vehicles;
}

export function getOrders(workshopId: string): WorkshopServiceOrder[] {
  return getCrmData(workshopId).orders;
}

export function getFictionalMechanics(workshopId: string, activeOnly = false): FictionalMechanic[] {
  const list = getCrmData(workshopId).fictionalMechanics;
  return activeOnly ? list.filter((m) => m.active) : list;
}

export function getPlatformMechanics(workshopId: string): MechanicAssignee[] {
  return (platformMechanicsByWorkshop[workshopId] ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    kind: "platform" as const,
    specialty: m.specialty,
  }));
}

export function getAllMechanicAssignees(workshopId: string, activeFictionalOnly = true): MechanicAssignee[] {
  const platform = getPlatformMechanics(workshopId);
  const fictional = getFictionalMechanics(workshopId, activeFictionalOnly).map((m) => ({
    id: m.id,
    name: m.name,
    kind: "fictional" as const,
    specialty: m.specialty,
  }));
  return [...platform, ...fictional];
}

export function resolveAssignee(
  workshopId: string,
  mechanicId: string,
  kind: MechanicKind
): MechanicAssignee | null {
  return getAllMechanicAssignees(workshopId, false).find((a) => a.id === mechanicId && a.kind === kind) ?? null;
}

export function addFictionalMechanic(
  workshopId: string,
  input: { name: string; specialty?: string; notes?: string }
): { ok: true; mechanic: FictionalMechanic } | { ok: false; error: string } {
  const data = getCrmData(workshopId);
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Informe o nome do funcionário." };

  if (data.fictionalMechanics.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: "Já existe um perfil fictício com este nome." };
  }

  const mechanic: FictionalMechanic = {
    id: `fic-${Date.now()}`,
    workshopId,
    name,
    specialty: input.specialty?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    active: true,
    createdAt: new Date().toISOString(),
  };

  data.fictionalMechanics.push(mechanic);
  saveCrmData(workshopId, data);
  return { ok: true, mechanic };
}

export function setFictionalMechanicActive(
  workshopId: string,
  mechanicId: string,
  active: boolean
): { ok: true } | { ok: false; error: string } {
  const data = getCrmData(workshopId);
  const index = data.fictionalMechanics.findIndex((m) => m.id === mechanicId);
  if (index === -1) return { ok: false, error: "Perfil não encontrado." };
  data.fictionalMechanics[index] = { ...data.fictionalMechanics[index], active };
  saveCrmData(workshopId, data);
  return { ok: true };
}

export function assignMechanicToOrder(
  workshopId: string,
  orderId: string,
  mechanicId: string,
  kind: MechanicKind
): { ok: true; order: WorkshopServiceOrder } | { ok: false; error: string } {
  const assignee = resolveAssignee(workshopId, mechanicId, kind);
  if (!assignee) return { ok: false, error: "Mecânico não encontrado." };
  if (kind === "fictional") {
    const fic = getFictionalMechanics(workshopId).find((m) => m.id === mechanicId);
    if (!fic?.active) return { ok: false, error: "Este perfil fictício está inativo." };
  }

  const data = getCrmData(workshopId);
  const index = data.orders.findIndex((o) => o.id === orderId);
  if (index === -1) return { ok: false, error: "Ordem de serviço não encontrada." };

  data.orders[index] = {
    ...data.orders[index],
    mechanicId: assignee.id,
    mechanicKind: assignee.kind,
    mechanicName: assignee.name,
  };
  saveCrmData(workshopId, data);
  return { ok: true, order: data.orders[index] };
}

export function createOrder(
  workshopId: string,
  input: {
    clientId: string;
    service: string;
    value: number;
    mechanicId: string;
    mechanicKind: MechanicKind;
    vehicleId?: string;
    status?: WorkshopServiceOrder["status"];
  }
): { ok: true; order: WorkshopServiceOrder } | { ok: false; error: string } {
  const data = getCrmData(workshopId);
  const client = data.clients.find((c) => c.id === input.clientId);
  if (!client) return { ok: false, error: "Cliente não encontrado." };

  const assignee = resolveAssignee(workshopId, input.mechanicId, input.mechanicKind);
  if (!assignee) return { ok: false, error: "Selecione quem executará o serviço." };

  const vehicle = input.vehicleId
    ? data.vehicles.find((v) => v.id === input.vehicleId)
    : data.vehicles.find((v) => v.clientId === input.clientId);

  const order: WorkshopServiceOrder = {
    id: `OS-${Date.now().toString().slice(-6)}`,
    workshopId,
    clientId: client.id,
    clientName: client.name,
    clientCpf: client.cpf,
    vehicle: vehicle?.model ?? "—",
    vehiclePlate: vehicle?.plate,
    service: input.service.trim(),
    status: input.status ?? "pendente",
    date: new Date().toISOString().split("T")[0],
    value: input.value,
    mechanicId: assignee.id,
    mechanicKind: assignee.kind,
    mechanicName: assignee.name,
  };

  data.orders.unshift(order);
  saveCrmData(workshopId, data);
  return { ok: true, order };
}

export function getMechanicProductivity(workshopId: string): MechanicProductivity[] {
  const orders = getOrders(workshopId);
  const assignees = getAllMechanicAssignees(workshopId, false);
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

export function getClientByCpf(workshopId: string, cpf: string): WorkshopClient | null {
  const normalized = normalizeCpf(cpf);
  return getClients(workshopId).find((c) => c.cpf === normalized) ?? null;
}

export function addClient(
  workshopId: string,
  input: { name: string; phone: string; cpf: string }
): { ok: true; client: WorkshopClient } | { ok: false; error: string } {
  const data = getCrmData(workshopId);
  const cpf = normalizeCpf(input.cpf);

  if (data.clients.some((c) => c.cpf === cpf)) {
    return { ok: false, error: "Já existe um cliente com este CPF nesta oficina." };
  }

  const client: WorkshopClient = {
    id: `cli-${Date.now()}`,
    workshopId,
    name: input.name.trim(),
    phone: input.phone.trim(),
    cpf,
    completedServices: [],
    createdAt: new Date().toISOString(),
  };

  data.clients.push(client);
  saveCrmData(workshopId, data);
  return { ok: true, client };
}

export function addVehicle(
  workshopId: string,
  input: { clientId: string; plate: string; model: string }
): { ok: true; vehicle: WorkshopVehicle } | { ok: false; error: string } {
  const data = getCrmData(workshopId);
  const client = data.clients.find((c) => c.id === input.clientId);
  if (!client) return { ok: false, error: "Cliente não encontrado." };

  const plate = input.plate.trim().toUpperCase();
  if (data.vehicles.some((v) => v.plate === plate)) {
    return { ok: false, error: "Já existe um veículo com esta placa." };
  }

  const vehicle: WorkshopVehicle = {
    id: `veh-${Date.now()}`,
    workshopId,
    clientId: input.clientId,
    assetType: "vehicle",
    referenceKey: plate.replace(/[^A-Z0-9]/g, ""),
    label: input.model.trim(),
    plate,
    model: input.model.trim(),
  };

  data.vehicles.push(vehicle);
  saveCrmData(workshopId, data);
  return { ok: true, vehicle };
}

export function completeOrder(
  workshopId: string,
  orderId: string
): { ok: true; order: WorkshopServiceOrder } | { ok: false; error: string } {
  const data = getCrmData(workshopId);
  const orderIndex = data.orders.findIndex((o) => o.id === orderId);
  if (orderIndex === -1) return { ok: false, error: "Ordem de serviço não encontrada." };

  const order = data.orders[orderIndex];
  if (order.status === "concluido") {
    return { ok: true, order };
  }

  const updated: WorkshopServiceOrder = { ...order, status: "concluido" };
  data.orders[orderIndex] = updated;

  const clientIndex = data.clients.findIndex((c) => c.id === order.clientId);
  if (clientIndex === -1) {
    saveCrmData(workshopId, data);
    return { ok: false, error: "Cliente vinculado à OS não encontrado no cadastro." };
  }

  const client = data.clients[clientIndex];
  const record: CompletedServiceRecord = {
    orderId: order.id,
    service: order.service,
    date: order.date,
    vehicle: order.vehicle,
  };

  const alreadyRegistered = client.completedServices.some((s) => s.orderId === order.id);
  if (!alreadyRegistered) {
    client.completedServices.push(record);
    data.clients[clientIndex] = client;
  }

  saveCrmData(workshopId, data);
  return { ok: true, order: updated };
}

export function updateOrderStatus(
  workshopId: string,
  orderId: string,
  status: WorkshopServiceOrder["status"]
): { ok: true; order: WorkshopServiceOrder } | { ok: false; error: string } {
  if (status === "concluido") {
    return completeOrder(workshopId, orderId);
  }

  const data = getCrmData(workshopId);
  const index = data.orders.findIndex((o) => o.id === orderId);
  if (index === -1) return { ok: false, error: "Ordem de serviço não encontrada." };

  data.orders[index] = { ...data.orders[index], status };
  saveCrmData(workshopId, data);
  return { ok: true, order: data.orders[index] };
}

export function getVerifiedClientsFromCrm(workshopId: string): VerifiedClient[] {
  return getClients(workshopId)
    .filter((c) => c.completedServices.length > 0)
    .map((c) => ({
      cpf: c.cpf,
      name: c.name,
      completedServices: c.completedServices,
    }));
}

export function countClientVehicles(workshopId: string, clientId: string): number {
  return getVehicles(workshopId).filter((v) => v.clientId === clientId).length;
}

export function canClientReview(workshopId: string, cpf: string): boolean {
  const client = getClientByCpf(workshopId, cpf);
  return (client?.completedServices.length ?? 0) > 0;
}

export function formatMechanicLabel(order: WorkshopServiceOrder): string {
  if (!order.mechanicName) return "—";
  if (order.mechanicKind === "fictional") {
    return `${order.mechanicName} (sem acesso)`;
  }
  return order.mechanicName;
}
