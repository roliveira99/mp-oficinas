"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/DashboardUI";
import { PermissionGuard } from "@/components/dashboard/PermissionGuard";
import { StatCard } from "@/components/dashboard/StatCard";
import type { MechanicDashboardStats } from "@/types/dashboard-insights";

type Period = "day" | "week" | "month";

export default function MecanicoProdutividadePage() {
  const [stats, setStats] = useState<MechanicDashboardStats | null>(null);
  const [period, setPeriod] = useState<Period>("month");

  const load = useCallback(async () => {
    const res = await fetch(`/api/dashboard/mechanic-stats?period=${period}`, { credentials: "include" });
    if (res.ok) setStats((await res.json()) as MechanicDashboardStats);
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxWeek = Math.max(...(stats?.weeklyCompleted.map((w) => w.count) ?? [1]), 1);

  return (
    <PermissionGuard permissions={["mecanico.consultar_produtividade"]}>
      <PageHeader
        title="Minha produtividade"
        description="Indicadores reais dos seus serviços e comissões"
      />

      <div className="mb-4 flex gap-2">
        {(["day", "week", "month"] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            className={period === p ? "dash-metric-tab dash-metric-tab--active" : "dash-metric-tab"}
            onClick={() => setPeriod(p)}
          >
            {p === "day" ? "Hoje" : p === "week" ? "Semana" : "Mês"}
          </button>
        ))}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Produtividade"
          value={stats ? `${stats.productivityPercent}%` : "—"}
          icon="chart"
          trend={stats ? "OS concluídas vs atribuídas" : undefined}
        />
        <StatCard label="Serviços concluídos" value={stats?.ordersCompleted ?? "—"} icon="wrench" />
        <StatCard
          label="Comissão no período"
          value={
            stats
              ? `R$ ${stats.commissionTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
              : "—"
          }
          icon="wallet"
        />
        <StatCard
          label="Taxa de comissão"
          value={stats ? `${stats.commissionRate}%` : "—"}
          icon="clipboard"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-semibold">Concluídos por semana (mês atual)</h2>
          {stats && stats.weeklyCompleted.length > 0 ? (
            <ul className="space-y-3">
              {stats.weeklyCompleted.map((w) => (
                <li key={w.label} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-muted">{w.label}</span>
                  <div className="h-2 flex-1 rounded-full bg-background">
                    <div
                      className="h-2 rounded-full bg-accent"
                      style={{ width: `${(w.count / maxWeek) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium tabular-nums">{w.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Sem serviços concluídos neste período.</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-semibold">Resumo do período</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-muted">OS atribuídas</span>
              <span className="font-medium">{stats?.ordersTotal ?? "—"}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Em andamento agora</span>
              <span className="font-medium">{stats?.ordersActive ?? "—"}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Comissão já recebida</span>
              <span className="font-medium">
                {stats
                  ? `R$ ${stats.commissionPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  : "—"}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </PermissionGuard>
  );
}
