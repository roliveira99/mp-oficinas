"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { FeatureList, PageHeader } from "@/components/dashboard/DashboardUI";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/components/auth/AuthProvider";
import { getOperationalConfig } from "@/lib/verticals/operational";
import { roleRestrictions } from "@/lib/permissions";
import { orderStatusLabels } from "@/lib/labels";
import type { MechanicDashboardStats } from "@/types/dashboard-insights";

const mecanicoFeatures = [
  "Criar orçamento",
  "Registrar serviços e peças utilizadas",
  "Consultar histórico dos próprios serviços",
  "Consultar comissões e produtividade",
  "Solicitar alteração de orçamento",
  "Registrar fotos do veículo",
  "Atualizar status do serviço",
];

export function MechanicHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState<MechanicDashboardStats | null>(null);
  const ops = getOperationalConfig(user?.workshopVertical);
  const roleLabel = ops.roles.operator;

  const load = useCallback(async () => {
    const res = await fetch("/api/dashboard/mechanic-stats?period=month", { credentials: "include" });
    if (res.ok) setStats((await res.json()) as MechanicDashboardStats);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const recent = stats?.recentOrders ?? [];

  return (
    <div>
      <PageHeader title="Meu painel" description={`${user?.name} — ${roleLabel}`} />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Serviços ativos" value={stats?.ordersActive ?? "—"} icon="wrench" />
        <StatCard
          label="Concluídos no mês"
          value={stats?.ordersCompleted ?? "—"}
          icon="clipboard"
        />
        <StatCard
          label="Comissões (mês)"
          value={
            stats
              ? `R$ ${stats.commissionTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
              : "—"
          }
          icon="wallet"
        />
        <StatCard
          label="Produtividade"
          value={stats ? `${stats.productivityPercent}%` : "—"}
          icon="chart"
          trend={stats ? `${stats.ordersCompleted} de ${stats.ordersTotal} OS` : undefined}
        />
      </div>

      <div className="card mb-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">Serviços ativos</h2>
          <Link href="/dashboard/mecanico/servicos" className="dash-link text-sm font-medium">
            Ver todos
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {recent.length === 0 ? (
            <li className="px-5 py-6 text-center text-sm text-muted">Nenhum serviço atribuído a você.</li>
          ) : (
            recent.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-5 py-4 text-sm">
                <div>
                  <p className="font-medium text-foreground">
                    {s.id} — {s.vehicle || "Sem referência"}
                  </p>
                  <p className="text-muted">{s.service}</p>
                </div>
                <span className="dash-badge">
                  {orderStatusLabels[s.status as keyof typeof orderStatusLabels] ?? s.status}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard/mecanico/orcamentos" className="card card-hover p-5">
          <div className="dash-icon-box mb-3">
            <Icon name="clipboard" className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-foreground">Novo orçamento</h3>
          <p className="mt-1 text-sm text-muted">Criar proposta para cliente</p>
        </Link>
        <Link href="/dashboard/mecanico/produtividade" className="card card-hover p-5">
          <div className="dash-icon-box mb-3">
            <Icon name="chart" className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-foreground">Produtividade</h3>
          <p className="mt-1 text-sm text-muted">Acompanhar desempenho</p>
        </Link>
      </div>

      <FeatureList allowed={mecanicoFeatures} restricted={roleRestrictions.mecanico} />
    </div>
  );
}
