import { matchesMechanicScope, getMechanicScopeForUser, type MechanicScope } from "@/lib/db/mechanic-scope";
import { prisma } from "@/lib/db/prisma";
import type { AuthUser } from "@/types/auth";
import type { MechanicDashboardStats } from "@/types/dashboard-insights";

function resolveRange(period: "day" | "week" | "month") {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  if (period === "week") {
    const day = from.getDay();
    const diff = day === 0 ? 6 : day - 1;
    from.setDate(from.getDate() - diff);
  } else if (period === "month") {
    from.setDate(1);
  }

  return { from, to };
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  return x;
}

function formatWeekLabel(d: Date) {
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
}

async function notesForMechanic(workshopId: string, scope: MechanicScope, from: Date, to: Date) {
  const ids = [scope.userId, ...scope.legacyPlatformIds];
  return prisma.serviceNote.findMany({
    where: {
      workshopId,
      issuedAt: { gte: from, lte: to },
      OR: [
        { mechanicKind: "platform", mechanicId: { in: ids } },
        { mechanicName: scope.name },
      ],
    },
    select: {
      id: true,
      total: true,
      commissionAmount: true,
      commissionPaid: true,
      commissionRate: true,
      issuedAt: true,
    },
  });
}

export async function getMechanicDashboardStats(
  user: AuthUser,
  period: "day" | "week" | "month" = "month"
): Promise<MechanicDashboardStats | null> {
  const scope = getMechanicScopeForUser(user);
  if (!scope || !user.workshopId) return null;

  const { from, to } = resolveRange(period);
  const workshopId = user.workshopId;

  const [orders, notes] = await Promise.all([
    prisma.crmServiceOrder.findMany({
      where: { workshopId },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    notesForMechanic(workshopId, scope, from, to),
  ]);

  const mine = orders.filter((o) => matchesMechanicScope(o, scope));
  const ordersActive = mine.filter((o) => o.status === "em_andamento" || o.status === "pendente").length;
  const ordersCompleted = mine.filter((o) => o.status === "concluido").length;
  const ordersTotal = mine.length;
  const productivityPercent =
    ordersTotal > 0 ? Math.round((ordersCompleted / ordersTotal) * 100) : 0;

  const commissionTotal = notes.reduce((s, n) => s + (n.commissionAmount ?? 0), 0);
  const commissionPaid = notes.filter((n) => n.commissionPaid).reduce((s, n) => s + (n.commissionAmount ?? 0), 0);
  const commissionRate = notes[0]?.commissionRate ?? 0;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const completedInMonth = mine.filter(
    (o) => o.status === "concluido" && o.updatedAt >= monthStart
  );

  const weeklyCompleted: { label: string; count: number }[] = [];
  let cursor = startOfWeek(monthStart);
  const now = new Date();
  while (cursor <= now) {
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const count = completedInMonth.filter(
      (o) => o.updatedAt >= cursor && o.updatedAt <= weekEnd
    ).length;
    weeklyCompleted.push({ label: formatWeekLabel(cursor), count });
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() + 7);
  }

  return {
    period,
    from: from.toISOString(),
    to: to.toISOString(),
    ordersActive,
    ordersCompleted: completedInMonth.length,
    ordersTotal,
    commissionTotal,
    commissionPaid,
    commissionRate,
    productivityPercent,
    weeklyCompleted,
    recentOrders: mine.slice(0, 6).map((o) => ({
      id: o.id,
      vehicle: o.vehicle,
      service: o.service,
      status: o.status,
      value: o.value,
    })),
  };
}
