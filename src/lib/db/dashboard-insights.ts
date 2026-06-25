import { getReviewStats, getReviewsForWorkshop } from "@/lib/db/reviews";
import { prisma } from "@/lib/db/prisma";
import type {
  DashboardAlert,
  MonthlyRevenuePoint,
  WorkshopInsights,
  WorkshopKpis,
  WorkshopReviewsInsight,
} from "@/types/dashboard-insights";

function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfMonth(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addMonths(d: Date, months: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

async function notesInRange(workshopId: string, from: Date, to: Date) {
  return prisma.serviceNote.findMany({
    where: {
      workshopId,
      issuedAt: { gte: from, lte: to },
      status: { in: ["emitida", "paga"] },
    },
    select: { id: true, total: true, issuedAt: true },
  });
}

function buildKpis(
  notes: { total: number }[],
  prevNotes: { total: number }[],
  budgetsPending: number,
  budgetsApproved: number,
  budgetsSent: number,
  newClients: number
): WorkshopKpis {
  const revenue = notes.reduce((s, n) => s + n.total, 0);
  const previousRevenue = prevNotes.reduce((s, n) => s + n.total, 0);
  const notesCount = notes.length;
  const prevCount = prevNotes.length;
  const ticketAverage = notesCount > 0 ? revenue / notesCount : 0;
  const previousTicketAverage = prevCount > 0 ? previousRevenue / prevCount : 0;
  const conversionRate =
    budgetsSent > 0 ? Math.round((budgetsApproved / budgetsSent) * 100) : 0;

  return {
    revenue,
    previousRevenue,
    ticketAverage,
    previousTicketAverage,
    notesCount,
    budgetsPending,
    budgetsApproved,
    budgetsSent,
    conversionRate,
    newClients,
  };
}

async function buildMonthlyRevenue(workshopId: string, months = 6): Promise<MonthlyRevenuePoint[]> {
  const now = new Date();
  const points: MonthlyRevenuePoint[] = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const ref = addMonths(startOfMonth(now), -i);
    const from = startOfMonth(ref);
    const to = endOfMonth(ref);
    const notes = await notesInRange(workshopId, from, to);
    points.push({
      label: monthLabel(ref),
      amount: notes.reduce((s, n) => s + n.total, 0),
    });
  }

  return points;
}

async function buildReviewsInsight(
  workshopId: string,
  fallbackRating: number,
  fallbackCount: number
): Promise<WorkshopReviewsInsight> {
  const [stats, allReviews] = await Promise.all([
    getReviewStats(workshopId, fallbackRating, fallbackCount),
    getReviewsForWorkshop(workshopId),
  ]);

  const recent = allReviews.slice(0, 5);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentMonth = allReviews.filter((r) => new Date(r.createdAt) >= thirtyDaysAgo);
  const older = allReviews.filter((r) => new Date(r.createdAt) < thirtyDaysAgo);

  let trendLabel: string | null = null;
  if (recentMonth.length >= 2 && older.length >= 2) {
    const avgRecent = recentMonth.reduce((s, r) => s + r.stars, 0) / recentMonth.length;
    const avgOlder = older.reduce((s, r) => s + r.stars, 0) / older.length;
    const diff = avgRecent - avgOlder;
    if (Math.abs(diff) >= 0.2) {
      trendLabel = diff > 0 ? "Nota em alta no último mês" : "Nota em queda no último mês";
    }
  }

  return {
    average: stats.average,
    count: stats.count,
    recent,
    trendLabel,
  };
}

async function buildAlerts(workshopId: string): Promise<DashboardAlert[]> {
  const alerts: DashboardAlert[] = [];
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [lowStock, staleBudgets, overduePay, overdueReceive, pendingAgenda] = await Promise.all([
    prisma.stockItem.findMany({
      where: { workshopId, minQuantity: { gt: 0 } },
      select: { id: true, name: true, quantity: true, minQuantity: true },
    }),
    prisma.workshopBudget.count({
      where: {
        workshopId,
        status: "aguardando_aprovacao",
        updatedAt: { lt: sevenDaysAgo },
      },
    }),
    prisma.financialEntry.count({
      where: {
        workshopId,
        kind: "pagar",
        paid: false,
        dueAt: { lt: todayStart },
      },
    }),
    prisma.financialEntry.count({
      where: {
        workshopId,
        kind: "receber",
        paid: false,
        dueAt: { lt: todayStart },
      },
    }),
    prisma.agendaRequest.count({
      where: { workshopId, status: { in: ["pendente", "alteracao_pendente"] } },
    }),
  ]);

  const criticalStock = lowStock.filter((s) => s.quantity <= s.minQuantity);
  if (criticalStock.length > 0) {
    alerts.push({
      id: "stock-low",
      severity: criticalStock.some((s) => s.quantity <= 0) ? "danger" : "warning",
      title: "Estoque baixo",
      message:
        criticalStock.length === 1
          ? `${criticalStock[0].name} está com ${criticalStock[0].quantity} un. (mín. ${criticalStock[0].minQuantity}).`
          : `${criticalStock.length} itens abaixo do estoque mínimo.`,
      href: "/dashboard/estoque",
    });
  }

  if (staleBudgets > 0) {
    alerts.push({
      id: "budgets-stale",
      severity: "warning",
      title: "Orçamentos parados",
      message: `${staleBudgets} orçamento(s) aguardando aprovação há mais de 7 dias.`,
      href: "/dashboard/orcamentos",
    });
  }

  if (overduePay > 0) {
    alerts.push({
      id: "pay-overdue",
      severity: "danger",
      title: "Contas a pagar vencidas",
      message: `${overduePay} conta(s) a pagar com vencimento em atraso.`,
      href: "/dashboard/financeiro",
    });
  }

  if (overdueReceive > 0) {
    alerts.push({
      id: "receive-overdue",
      severity: "warning",
      title: "Recebimentos em atraso",
      message: `${overdueReceive} conta(s) a receber vencidas.`,
      href: "/dashboard/financeiro",
    });
  }

  if (pendingAgenda > 0) {
    alerts.push({
      id: "agenda-pending",
      severity: "info",
      title: "Agendamentos pendentes",
      message: `${pendingAgenda} solicitação(ões) de agenda aguardando confirmação.`,
      href: "/dashboard/agenda",
    });
  }

  return alerts;
}

export async function getWorkshopInsights(workshopId: string): Promise<WorkshopInsights> {
  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
    select: { rating: true, reviewCount: true },
  });

  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);
  const prevFrom = startOfMonth(addMonths(now, -1));
  const prevTo = endOfMonth(addMonths(now, -1));

  const [
    notes,
    prevNotes,
    budgetsPending,
    budgetsApprovedMonth,
    budgetsSentMonth,
    newClients,
    monthlyRevenue,
    reviews,
    alerts,
  ] = await Promise.all([
    notesInRange(workshopId, from, to),
    notesInRange(workshopId, prevFrom, prevTo),
    prisma.workshopBudget.count({
      where: { workshopId, status: "aguardando_aprovacao" },
    }),
    prisma.workshopBudget.count({
      where: {
        workshopId,
        status: { in: ["aprovado", "convertido"] },
        updatedAt: { gte: from, lte: to },
      },
    }),
    prisma.workshopBudget.count({
      where: {
        workshopId,
        status: { in: ["aguardando_aprovacao", "aprovado", "convertido", "rejeitado"] },
        updatedAt: { gte: from, lte: to },
      },
    }),
    prisma.crmClient.count({
      where: { workshopId, createdAt: { gte: from, lte: to } },
    }),
    buildMonthlyRevenue(workshopId),
    buildReviewsInsight(workshopId, workshop?.rating ?? 0, workshop?.reviewCount ?? 0),
    buildAlerts(workshopId),
  ]);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    kpis: buildKpis(
      notes,
      prevNotes,
      budgetsPending,
      budgetsApprovedMonth,
      budgetsSentMonth,
      newClients
    ),
    monthlyRevenue,
    reviews,
    alerts,
  };
}
