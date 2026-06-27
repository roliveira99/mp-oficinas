"use client";

import type { DocumentLineItem } from "@/types/document-line";
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

export type CrmPayload = WorkshopCrmData & {
  productivity: MechanicProductivity[];
  assignees: MechanicAssignee[];
};

export async function fetchCrm(): Promise<CrmPayload> {
  const res = await fetch("/api/crm");
  if (!res.ok) throw new Error("Falha ao carregar CRM.");
  return res.json() as Promise<CrmPayload>;
}

async function crmPost(body: Record<string, unknown>) {
  const res = await fetch("/api/crm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiAddClient(input: { name: string; phone: string; cpf: string }) {
  return crmPost({ action: "add-client", ...input }) as Promise<
    { ok: true; client: WorkshopClient } | { ok: false; error: string }
  >;
}

export async function apiUnlinkVehicle(vehicleId: string) {
  return crmPost({ action: "unlink-vehicle", vehicleId }) as Promise<
    { ok: true; vehicle: WorkshopVehicle } | { ok: false; error: string }
  >;
}

export async function apiLinkVehicle(vehicleId: string, clientId: string) {
  return crmPost({ action: "link-vehicle", vehicleId, clientId }) as Promise<
    { ok: true; vehicle: WorkshopVehicle } | { ok: false; error: string }
  >;
}

export async function apiAddAsset(input: {
  referenceKey: string;
  label: string;
  assetType?: import("@/types/client").BusinessAssetType;
  year?: string;
  clientId?: string;
}) {
  return crmPost({ action: "add-asset", ...input }) as Promise<
    { ok: true; vehicle: WorkshopVehicle } | { ok: false; error: string }
  >;
}

export async function apiAddVehicle(input: { plate: string; model: string; year?: string; clientId?: string }) {
  return crmPost({ action: "add-vehicle", ...input }) as Promise<
    { ok: true; vehicle: WorkshopVehicle } | { ok: false; error: string }
  >;
}

export async function apiCreateOrder(input: {
  vehicleId?: string;
  service: string;
  value: number;
  mechanicId: string;
  mechanicKind: MechanicKind;
  clientId?: string;
  status?: ServiceOrderStatus;
  lineItems?: DocumentLineItem[];
  paymentMethods?: string[];
}) {
  return crmPost({ action: "create-order", ...input }) as Promise<
    { ok: true; order: WorkshopServiceOrder } | { ok: false; error: string }
  >;
}

export async function apiCompleteOrder(orderId: string) {
  return crmPost({ action: "complete-order", orderId }) as Promise<
    { ok: true; order: WorkshopServiceOrder } | { ok: false; error: string }
  >;
}

export async function apiUpdateOrderStatus(orderId: string, status: ServiceOrderStatus) {
  return crmPost({ action: "update-order-status", orderId, status }) as Promise<
    { ok: true; order: WorkshopServiceOrder } | { ok: false; error: string }
  >;
}

export async function apiAssignMechanic(orderId: string, mechanicId: string, mechanicKind: MechanicKind) {
  return crmPost({ action: "assign-mechanic", orderId, mechanicId, mechanicKind }) as Promise<
    { ok: true; order: WorkshopServiceOrder } | { ok: false; error: string }
  >;
}

export async function apiAddFictionalMechanic(input: { name: string; specialty?: string; notes?: string }) {
  return crmPost({ action: "add-fictional", ...input }) as Promise<
    { ok: true; mechanic: FictionalMechanic } | { ok: false; error: string }
  >;
}

export async function apiSetFictionalActive(mechanicId: string, active: boolean) {
  return crmPost({ action: "set-fictional-active", mechanicId, active }) as Promise<
    { ok: true } | { ok: false; error: string }
  >;
}

export async function fetchCatalog(): Promise<{
  catalog: import("@/types/workshop").WorkshopCatalog | null;
  publicCatalog?: import("@/types/workshop").WorkshopCatalog;
  slug?: string;
}> {
  const res = await fetch("/api/catalog");
  if (!res.ok) throw new Error("Falha ao carregar catálogo.");
  return res.json() as Promise<{
    catalog: import("@/types/workshop").WorkshopCatalog | null;
    publicCatalog?: import("@/types/workshop").WorkshopCatalog;
    slug?: string;
  }>;
}

export async function saveCatalog(catalog: import("@/types/workshop").WorkshopCatalog) {
  const res = await fetch("/api/catalog", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ catalog }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Falha ao salvar catálogo.");
  }
}

export async function fetchSuppliers() {
  const res = await fetch("/api/suppliers");
  if (!res.ok) throw new Error("Falha ao carregar fornecedores.");
  return res.json() as Promise<{ suppliers: import("@/types/workshop").SupplierContact[] }>;
}

export async function apiAddSupplier(input: { name: string; phone: string; notes?: string }) {
  const res = await fetch("/api/suppliers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "add", ...input }),
  });
  return res.json() as Promise<{ suppliers: import("@/types/workshop").SupplierContact[] }>;
}

export async function apiRemoveSupplier(id: string) {
  const res = await fetch("/api/suppliers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "remove", id }),
  });
  return res.json() as Promise<{ suppliers: import("@/types/workshop").SupplierContact[] }>;
}

export async function fetchWorkshopMedia() {
  const res = await fetch("/api/workshop/media");
  if (!res.ok) throw new Error("Falha ao carregar mídia.");
  return res.json() as Promise<{
    coverImage: string | null;
    tagline: string | null;
    slogan: string | null;
    gallery: import("@/types/workshop").WorkshopGalleryItem[];
    profileVideos: string[];
    profileShowcase: import("@/types/workshop").WorkshopShowcaseItem[];
    profileHighlights: { title: string; body: string }[];
    businessOpportunities: { title: string; body: string }[];
  }>;
}

export async function saveWorkshopMedia(input: {
  coverImage?: string;
  tagline?: string;
  slogan?: string;
  gallery?: import("@/types/workshop").WorkshopGalleryItem[];
  profileVideos?: string[];
  profileShowcase?: import("@/types/workshop").WorkshopShowcaseItem[];
  profileHighlights?: { title: string; body: string }[];
  businessOpportunities?: { title: string; body: string }[];
}) {
  const res = await fetch("/api/workshop/media", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Falha ao salvar mídia.");
  }
  return res.json() as Promise<{
    coverImage: string | null;
    tagline: string | null;
    slogan: string | null;
    gallery: import("@/types/workshop").WorkshopGalleryItem[];
    profileVideos: string[];
    profileShowcase: import("@/types/workshop").WorkshopShowcaseItem[];
    profileHighlights: { title: string; body: string }[];
    businessOpportunities: { title: string; body: string }[];
  }>;
}

export async function fetchAllAgenda() {
  const res = await fetch("/api/agenda");
  if (!res.ok) return { requests: [] };
  return res.json() as Promise<{ requests: import("@/types/workshop").AgendaRequest[] }>;
}

export async function apiAgendaAction(
  action: "approve" | "reject" | "whatsapp" | "propose-change" | "confirm-change" | "cancel-change",
  id: string,
  extra?: { proposedDate?: string; proposedTime?: string }
): Promise<{ ok: boolean; whatsappUrl?: string; error?: string }> {
  const res = await fetch("/api/agenda", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, id, ...extra }),
  });
  return res.json() as Promise<{ ok: boolean; whatsappUrl?: string; error?: string }>;
}
