"use client";

import type { MonthlyRevenuePoint, WorkshopKpis } from "@/types/dashboard-insights";

function formatCurrency(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function trendPct(current: number, previous: number) {
  if (previous <= 0) return null;
  const diff = ((current - previous) / previous) * 100;
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${diff.toFixed(0)}% vs mês anterior`;
}

function KpiCard({
  label,
  value,
  trend,
  hint,
}: {
  label: string;
  value: string;
  trend?: string | null;
  hint?: string;
}) {
  return (
    <div className="dash-stat">
      <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-xs uppercase tracking-wide text-muted">{label}</p>
      {trend && <p className="mt-1 text-xs text-accent">{trend}</p>}
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function DashboardPerformanceSection({
  kpis,
  monthlyRevenue,
}: {
  kpis: WorkshopKpis;
  monthlyRevenue: MonthlyRevenuePoint[];
}) {
  const maxAmount = Math.max(...monthlyRevenue.map((m) => m.amount), 1);

  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="font-semibold text-foreground">Desempenho do mês</h2>
        <p className="text-sm text-muted">Indicadores para acompanhar a evolução do negócio</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Faturamento"
          value={formatCurrency(kpis.revenue)}
          trend={trendPct(kpis.revenue, kpis.previousRevenue)}
        />
        <KpiCard
          label="Ticket médio"
          value={formatCurrency(kpis.ticketAverage)}
          trend={trendPct(kpis.ticketAverage, kpis.previousTicketAverage)}
        />
        <KpiCard
          label="Conversão de orçamentos"
          value={`${kpis.conversionRate}%`}
          hint={`${kpis.budgetsApproved} aprovados de ${kpis.budgetsSent} enviados`}
        />
        <KpiCard
          label="Clientes novos"
          value={String(kpis.newClients)}
          hint={`${kpis.notesCount} notas emitidas no mês`}
        />
      </div>

      {monthlyRevenue.length > 0 && (
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Evolução do faturamento (6 meses)
          </h3>
          <div className="flex h-28 items-end gap-2 sm:gap-3">
            {monthlyRevenue.map((point) => {
              const pct = maxAmount > 0 ? point.amount / maxAmount : 0;
              const barHeight = Math.round(Math.max(pct * 96, point.amount > 0 ? 8 : 4));
              return (
                <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] font-medium tabular-nums text-muted sm:text-xs">
                    {point.amount > 0
                      ? point.amount >= 1000
                        ? `${(point.amount / 1000).toFixed(1)}k`
                        : point.amount.toFixed(0)
                      : "—"}
                  </span>
                  <div
                    className="w-full rounded-t bg-accent/80"
                    style={{ height: `${barHeight}px` }}
                    title={formatCurrency(point.amount)}
                  />
                  <span className="text-center text-[10px] uppercase text-muted">{point.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
