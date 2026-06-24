import type { WorkshopReview } from "@/types/review";

export type DashboardAlertSeverity = "info" | "warning" | "danger";

export interface DashboardAlert {
  id: string;
  severity: DashboardAlertSeverity;
  title: string;
  message: string;
  href?: string;
}

export interface WorkshopKpis {
  revenue: number;
  previousRevenue: number;
  ticketAverage: number;
  previousTicketAverage: number;
  notesCount: number;
  budgetsPending: number;
  budgetsApproved: number;
  budgetsSent: number;
  conversionRate: number;
  newClients: number;
}

export interface MonthlyRevenuePoint {
  label: string;
  amount: number;
}

export interface WorkshopReviewsInsight {
  average: number;
  count: number;
  recent: WorkshopReview[];
  trendLabel: string | null;
}

export interface WorkshopInsights {
  from: string;
  to: string;
  kpis: WorkshopKpis;
  monthlyRevenue: MonthlyRevenuePoint[];
  reviews: WorkshopReviewsInsight;
  alerts: DashboardAlert[];
}

export interface MechanicDashboardStats {
  period: "day" | "week" | "month";
  from: string;
  to: string;
  ordersActive: number;
  ordersCompleted: number;
  ordersTotal: number;
  commissionTotal: number;
  commissionPaid: number;
  commissionRate: number;
  productivityPercent: number;
  weeklyCompleted: { label: string; count: number }[];
  recentOrders: {
    id: string;
    vehicle: string;
    service: string;
    status: string;
    value: number;
  }[];
}
