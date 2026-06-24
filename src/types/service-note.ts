import type { DocumentLineItem } from "@/types/document-line";
import type { MechanicKind } from "@/types/client";

export interface ServiceNoteRecord {
  id: string;
  workshopId: string;
  vehicleId: string | null;
  clientId: string | null;
  budgetId: string | null;
  orderId: string | null;
  status: "rascunho" | "emitida" | "paga" | "cancelada";
  lineItems: DocumentLineItem[];
  paymentMethods: string[];
  subtotal: number;
  total: number;
  mechanicId: string | null;
  mechanicKind: MechanicKind | null;
  mechanicName: string | null;
  commissionRate: number | null;
  commissionAmount: number | null;
  commissionPaid: boolean;
  commissionPaidAt: string | null;
  issuedAt: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  clientName?: string;
}
