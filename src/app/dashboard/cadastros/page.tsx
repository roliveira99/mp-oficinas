"use client";

import { useState } from "react";
import { PageHeader, TabPanel } from "@/components/dashboard/DashboardUI";
import { AtivosTab, ClientesTab } from "@/components/dashboard/CadastrosTabs";
import {
  FuncionariosTab,
  PecasCadastroTab,
  ServicosCadastroTab,
} from "@/components/dashboard/CadastroExtraTabs";
import { PermissionGuard } from "@/components/dashboard/PermissionGuard";
import { getOperationalConfig } from "@/lib/verticals/operational";
import type { Permission } from "@/types/auth";
import { useAuth } from "@/components/auth/AuthProvider";

export default function CadastrosPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("ativos");
  const isOwner = user?.role === "dono";
  const workshopId = user?.workshopId ?? "1";
  const ops = getOperationalConfig(user?.workshopVertical);

  const tabs = [
    ...(ops.assets.enabled
      ? [
          {
            id: "ativos",
            label: ops.assets.tabLabel,
            content: <AtivosTab workshopId={workshopId} config={ops} />,
          },
        ]
      : []),
    {
      id: "clientes",
      label: "Clientes (avaliações)",
      content: <ClientesTab workshopId={workshopId} />,
    },
    ...(isOwner
      ? [
          { id: "pecas", label: ops.catalog.partsLabel, content: <PecasCadastroTab /> },
          { id: "servicos", label: ops.catalog.servicesLabel, content: <ServicosCadastroTab /> },
          { id: "funcionarios", label: "Funcionários", content: <FuncionariosTab /> },
        ]
      : []),
  ];

  const permissions: Permission[] = isOwner
    ? [
        "owner.cadastro_clientes",
        "owner.cadastro_veiculos",
        "owner.cadastro_pecas",
        "owner.cadastro_servicos",
        "owner.cadastro_funcionarios",
      ]
    : ["gerencia.cadastro_clientes", "gerencia.cadastro_veiculos"];

  return (
    <PermissionGuard permissions={permissions}>
      <PageHeader
        title={isOwner ? "Cadastros" : `${ops.assets.pluralLabel} e clientes`}
        description={
          isOwner
            ? `${ops.assets.pluralLabel}, clientes (avaliação), ${ops.catalog.partsLabel.toLowerCase()}, ${ops.catalog.servicesLabel.toLowerCase()} e equipe com acesso ao sistema`
            : `Cadastro operacional de ${ops.assets.pluralLabel.toLowerCase()}`
        }
      />
      <TabPanel tabs={tabs} activeTab={tab} onTabChange={setTab} />
    </PermissionGuard>
  );
}
