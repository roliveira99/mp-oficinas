"use client";

import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";
import { FeatureList, PageHeader } from "@/components/dashboard/DashboardUI";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/components/auth/AuthProvider";
import { demoOrders } from "@/data/workshops";
import { roleRestrictions } from "@/lib/permissions";

const gerenciaFeatures = [
  "Dashboard operacional",
  "Aprovação e alteração de orçamentos",
  "Cadastro de veículos",
  "Controle de estoque (entrada e saída)",
  "Emissão de notas, PDF e WhatsApp",
  "Relatórios operacionais",
  "Controle de agenda e serviços",
];

const quickLinks = [
  { href: "/dashboard/orcamentos", label: "Orçamentos", desc: "Aprovar e alterar", icon: "file" as const },
  { href: "/dashboard/agenda", label: "Agenda", desc: "Agendamentos do dia", icon: "calendar" as const },
  { href: "/dashboard/estoque", label: "Estoque", desc: "Entrada e saída", icon: "box" as const },
];

export function ManagerHome() {
  const { user } = useAuth();
  const pending = demoOrders.filter((o) => o.status === "pendente").length;
  const inProgress = demoOrders.filter((o) => o.status === "em_andamento").length;

  return (
    <div>
      <PageHeader
        title="Dashboard operacional"
        description={`${user?.name} — ${user?.workshopName}`}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Orçamentos pendentes" value={pending} icon="clipboard" />
        <StatCard label="Serviços em andamento" value={inProgress} icon="wrench" />
        <StatCard label="Agendamentos hoje" value={6} icon="calendar" />
        <StatCard label="Estoque baixo" value={3} icon="box" trend="Repor" trendPositive={false} />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href} className="card card-hover p-5">
            <div className="dash-icon-box mb-3">
              <Icon name={item.icon} className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground">{item.label}</h3>
            <p className="mt-1 text-sm text-muted">{item.desc}</p>
          </Link>
        ))}
      </div>

      <FeatureList allowed={gerenciaFeatures} restricted={roleRestrictions.gerencia} />
    </div>
  );
}
