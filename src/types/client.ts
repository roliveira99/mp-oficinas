import type { CompletedServiceRecord } from "@/types/review";

export interface WorkshopClient {
  id: string;
  workshopId: string;
  name: string;
  phone: string;
  cpf: string;
  completedServices: CompletedServiceRecord[];
  createdAt: string;
}

export interface WorkshopVehicle {
  id: string;
  workshopId: string;
  clientId?: string | null;
  plate: string;
  model: string;
  completedServices?: import("@/types/review").CompletedServiceRecord[];
}

export type MechanicKind = "fictional" | "platform";

/** Funcionário sem login — só para lançar produção em nome dele. */
export interface FictionalMechanic {
  id: string;
  workshopId: string;
  name: string;
  specialty?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface MechanicAssignee {
  id: string;
  name: string;
  kind: MechanicKind;
  specialty?: string;
}

export type ServiceOrderStatus = "pendente" | "em_andamento" | "concluido" | "cancelado";

export interface MechanicProductivity {
  assignee: MechanicAssignee;
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  totalValue: number;
  completedValue: number;
}

export interface WorkshopServiceOrder {
  id: string;
  workshopId: string;
  clientId?: string | null;
  vehicleId?: string | null;
  clientName: string;
  clientCpf: string;
  vehicle: string;
  vehiclePlate?: string;
  service: string;
  status: ServiceOrderStatus;
  date: string;
  value: number;
  mechanicId?: string;
  mechanicKind?: MechanicKind;
  mechanicName?: string;
}

export interface WorkshopCrmData {
  clients: WorkshopClient[];
  vehicles: WorkshopVehicle[];
  orders: WorkshopServiceOrder[];
  fictionalMechanics: FictionalMechanic[];
}
