import type { MechanicKind } from "@/types/client";
import type { DocumentLineItem } from "@/types/document-line";

export type BudgetStatus =
  | "rascunho"
  | "aguardando_aprovacao"
  | "aprovado"
  | "rejeitado"
  | "convertido";

export interface BudgetRecord {
  id: string;
  workshopId: string;
  vehicleId: string | null;
  status: BudgetStatus;
  lineItems: DocumentLineItem[];
  paymentMethods: string[];
  subtotal: number;
  total: number;
  notes: string | null;
  mechanicId: string | null;
  mechanicKind: MechanicKind | null;
  mechanicName: string | null;
  approvedAt: string | null;
  sentAt: string | null;
  serviceNoteId: string | null;
  createdAt: string;
  createdById?: string | null;
  vehiclePlate?: string;
  vehicleModel?: string;
  vehicleYear?: string;
}
