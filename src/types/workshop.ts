import type { BusinessVertical } from "@/types/vertical";

export interface CatalogItem {
  id: string;
  name: string;
  priceFrom: number;
  description?: string;
}

export interface MechanicRankingEntry {
  name: string;
  rating: number;
  servicesCompleted: number;
  specialty?: string;
}

export interface WorkshopCatalog {
  services: CatalogItem[];
  parts: CatalogItem[];
}

export type WorkshopType = "carros" | "motos" | "mista" | "estetica";

export type GalleryItemKind = "ambiente" | "antes" | "depois" | "equipe";

export interface WorkshopGalleryItem {
  id: string;
  url: string;
  caption: string;
  kind: GalleryItemKind;
}

export interface Workshop {
  id: string;
  name: string;
  slug: string;
  vertical?: BusinessVertical;
  category?: string | null;
  type: WorkshopType;
  description: string;
  tagline?: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  whatsapp: string;
  email: string;
  rating: number;
  reviewCount: number;
  services: string[];
  openingHours: string;
  image: string;
  coverImage?: string;
  gallery?: WorkshopGalleryItem[];
  specialties: string[];
  hasAgenda: boolean;
  paymentMethods: string[];
  blocked?: boolean;
  catalog: WorkshopCatalog;
  mechanicRanking?: MechanicRankingEntry[];
}

export interface SupplierContact {
  id: string;
  name: string;
  phone: string;
  notes?: string;
}

export interface AgendaRequest {
  id: string;
  workshopId: string;
  clientName: string;
  clientPhone: string;
  vehicle?: string;
  preferredDate: string;
  preferredTime: string;
  proposedDate?: string;
  proposedTime?: string;
  service: string;
  status: "pendente" | "aprovado" | "alteracao_pendente" | "recusado";
  createdAt: string;
}

export interface ServiceOrder {
  id: string;
  clientName: string;
  vehicle: string;
  service: string;
  status: "pendente" | "em_andamento" | "concluido" | "cancelado";
  date: string;
  value: number;
}

export interface DashboardStats {
  ordersToday: number;
  ordersInProgress: number;
  monthlyRevenue: number;
  activeClients: number;
}
