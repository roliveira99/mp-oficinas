"use client";

import { useState } from "react";
import { ActionButton, TabPanel } from "@/components/dashboard/DashboardUI";
import { PageHeader } from "@/components/dashboard/DashboardUI";
import { ClientesTab, VeiculosTab } from "@/components/dashboard/CadastrosTabs";
import { PermissionGuard } from "@/components/dashboard/PermissionGuard";
import type { Permission } from "@/types/auth";
import { useAuth } from "@/components/auth/AuthProvider";

const servicos = [
  { nome: "Troca de óleo", valor: 120, tempo: "30 min" },
  { nome: "Alinhamento", valor: 80, tempo: "45 min" },
  { nome: "Revisão freios", valor: 250, tempo: "2h" },
];

const funcionarios = [
  { nome: "Maria Santos", cargo: "Gerente", email: "gerencia@mpoficinas.com" },
  { nome: "Pedro Oliveira", cargo: "Mecânico", email: "mecanico@mpoficinas.com" },
  { nome: "Lucas Ferreira", cargo: "Mecânico", email: "lucas@autocenter.com" },
];

export default function CadastrosPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("veiculos");
  const isOwner = user?.role === "dono";
  const workshopId = user?.workshopId ?? "1";

  const tabs = [
    {
      id: "veiculos",
      label: "Veículos",
      content: <VeiculosTab workshopId={workshopId} />,
    },
    {
      id: "clientes",
      label: "Clientes (avaliações)",
      content: <ClientesTab workshopId={workshopId} />,
    },
    ...(isOwner
      ? [
          {
            id: "pecas",
            label: "Peças",
            content: (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-hover/80 text-left">
                      {["Código", "Nome", "Valor", "Ações"].map((h) => (
                        <th key={h} className="px-5 py-3 text-xs font-semibold uppercase text-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-5 py-3.5">P-001</td>
                      <td className="px-5 py-3.5">Filtro de óleo</td>
                      <td className="px-5 py-3.5">R$ 35</td>
                      <td className="px-5 py-3.5"><ActionButton label="Editar" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ),
          },
          {
            id: "servicos",
            label: "Serviços",
            content: (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-hover/80 text-left">
                      {["Serviço", "Valor", "Tempo", "Ações"].map((h) => (
                        <th key={h} className="px-5 py-3 text-xs font-semibold uppercase text-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {servicos.map((s) => (
                      <tr key={s.nome}>
                        <td className="px-5 py-3.5">{s.nome}</td>
                        <td className="px-5 py-3.5">R$ {s.valor}</td>
                        <td className="px-5 py-3.5">{s.tempo}</td>
                        <td className="px-5 py-3.5"><ActionButton label="Editar" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ),
          },
          {
            id: "funcionarios",
            label: "Funcionários",
            content: (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-hover/80 text-left">
                      {["Nome", "Cargo", "E-mail", "Ações"].map((h) => (
                        <th key={h} className="px-5 py-3 text-xs font-semibold uppercase text-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {funcionarios.map((f) => (
                      <tr key={f.email}>
                        <td className="px-5 py-3.5">{f.nome}</td>
                        <td className="px-5 py-3.5">{f.cargo}</td>
                        <td className="px-5 py-3.5">{f.email}</td>
                        <td className="px-5 py-3.5"><ActionButton label="Editar" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ),
          },
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
        title={isOwner ? "Cadastros" : "Veículos e clientes"}
        description={
          isOwner
            ? "Cadastre veículos por placa. Clientes se registram ao avaliar no perfil público."
            : "Cadastro operacional de veículos — cliente só se identifica na avaliação"
        }
      />
      <TabPanel tabs={tabs} activeTab={tab} onTabChange={setTab} />
    </PermissionGuard>
  );
}
