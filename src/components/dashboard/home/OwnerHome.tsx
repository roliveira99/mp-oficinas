"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DashboardAlertsPanel } from "@/components/dashboard/DashboardAlertsPanel";
import { DashboardMetricPanel } from "@/components/dashboard/DashboardMetricPanel";
import { DashboardPerformanceSection } from "@/components/dashboard/DashboardPerformanceSection";
import { DashboardReviewsPanel } from "@/components/dashboard/DashboardReviewsPanel";
import { SubscriptionBanner } from "@/components/dashboard/SubscriptionBanner";
import { PageHeader } from "@/components/dashboard/DashboardUI";
import { useAuth } from "@/components/auth/AuthProvider";
import { orderStatusColors, orderStatusLabels } from "@/lib/labels";
import type { WorkshopInsights } from "@/types/dashboard-insights";
import type { WorkshopServiceOrder } from "@/types/client";

export function OwnerHome() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<WorkshopServiceOrder[]>([]);
  const [insights, setInsights] = useState<WorkshopInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(true);

  const refresh = useCallback(async () => {
    const [crmRes, insightsRes] = await Promise.all([
      fetch("/api/crm", { credentials: "include" }),
      fetch("/api/dashboard/insights", { credentials: "include" }),
    ]);

    if (crmRes.ok) {
      const data = (await crmRes.json()) as { orders: WorkshopServiceOrder[] };
      setOrders(data.orders.slice(0, 6));
    }

    if (insightsRes.ok) {
      setInsights((await insightsRes.json()) as WorkshopInsights);
    }
    setLoadingInsights(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const inProgress = orders.filter((o) => o.status === "em_andamento").length;
  const today = new Date().toISOString().split("T")[0];
  const ordersToday = orders.filter((o) => o.date === today).length;

  return (
    <div>
      <PageHeader
        title="Dashboard do negócio"
        description={`Bem-vindo, ${user?.name} — ${user?.workshopName}`}
      />

      <SubscriptionBanner />

      {!loadingInsights && insights && (
        <>
          <DashboardAlertsPanel alerts={insights.alerts} />
          <DashboardPerformanceSection kpis={insights.kpis} monthlyRevenue={insights.monthlyRevenue} />
        </>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <StatCard label="Ordens hoje" value={ordersToday} />
        <StatCard label="Em andamento" value={inProgress} />
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <DashboardMetricPanel
          title="Clientes atendidos"
          subtitle="Atendimentos concluídos no período"
          icon="users"
          mode="count"
          valueKey="clientsServed"
          previousKey="previousClientsServed"
          breakdownKey="value"
        />
        <DashboardMetricPanel
          title="Receita operacional"
          subtitle="Ordens de serviço concluídas no período"
          icon="wallet"
          mode="currency"
          valueKey="revenue"
          previousKey="previousRevenue"
          breakdownKey="amount"
        />
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        {insights && <DashboardReviewsPanel reviews={insights.reviews} />}
        <div className="card flex flex-col justify-center p-6">
          <h3 className="font-semibold text-foreground">Próximos passos</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/dashboard/orcamentos" className="text-accent hover:underline">
                Enviar orçamentos pendentes
              </Link>
            </li>
            <li>
              <Link href="/dashboard/financeiro" className="text-accent hover:underline">
                Conferir fluxo de caixa
              </Link>
            </li>
            <li>
              <Link href="/dashboard/perfil" className="text-accent hover:underline">
                Atualizar perfil público
              </Link>
            </li>
            <li>
              <Link href="/dashboard/relatorios" className="text-accent hover:underline">
                Exportar relatório do mês
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="card mb-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">Ordens recentes</h2>
          <Link href="/dashboard/orcamentos" className="dash-link text-sm font-medium">
            Ver orçamentos
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="dash-table-head border-b border-border text-left">
                <th className="px-5 py-3 font-semibold">OS</th>
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="px-5 py-3 font-semibold">Referência</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-muted">
                    Nenhuma ordem registrada ainda.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{order.id}</td>
                    <td className="px-5 py-3 text-foreground">{order.clientName || "—"}</td>
                    <td className="px-5 py-3 text-muted">{order.vehicle}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${orderStatusColors[order.status]}`}
                      >
                        {orderStatusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-foreground">
                      R$ {order.value.toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="dash-stat">
      <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-xs uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}
