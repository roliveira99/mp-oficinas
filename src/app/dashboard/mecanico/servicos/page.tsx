"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionButton, DataTable } from "@/components/dashboard/DashboardUI";
import { PageHeader } from "@/components/dashboard/DashboardUI";
import { PermissionGuard } from "@/components/dashboard/PermissionGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatCpf } from "@/lib/cpf";
import { orderStatusLabels } from "@/lib/labels";
import { getMechanicScopeForUser, matchesMechanicScope } from "@/lib/db/mechanic-scope";
import { apiCompleteOrder, apiUpdateOrderStatus, fetchCrm } from "@/lib/api/crm-client";
import type { ServiceOrderStatus, WorkshopServiceOrder } from "@/types/client";

const statusOptions: { label: string; value: ServiceOrderStatus }[] = [
  { label: "Pendente", value: "pendente" },
  { label: "Em andamento", value: "em_andamento" },
  { label: "Concluído", value: "concluido" },
];

export default function MecanicoServicosPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<WorkshopServiceOrder[]>([]);
  const [selected, setSelected] = useState<WorkshopServiceOrder | null>(null);
  const [feedback, setFeedback] = useState("");

  const refresh = useCallback(async () => {
    const data = await fetchCrm();
    const scope = user ? getMechanicScopeForUser(user) : null;
    setOrders(
      scope
        ? data.orders.filter((o) => matchesMechanicScope(o, scope))
        : data.orders
    );
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh, user?.workshopId]);

  async function applyStatus(status: ServiceOrderStatus) {
    if (!selected) return;
    const result =
      status === "concluido"
        ? await apiCompleteOrder(selected.id)
        : await apiUpdateOrderStatus(selected.id, status);

    if (!result.ok) {
      setFeedback(result.error);
      return;
    }

    if (status === "concluido") {
      setFeedback(
        `Serviço concluído. Cliente ${selected.clientName} (CPF ${formatCpf(selected.clientCpf)}) pode avaliar a oficina.`
      );
    } else {
      setFeedback(`Status atualizado para ${orderStatusLabels[status]}.`);
    }

    setSelected(null);
    await refresh();
  }

  return (
    <PermissionGuard
      permissions={[
        "mecanico.registrar_servicos",
        "mecanico.historico_proprio",
        "mecanico.atualizar_status",
        "mecanico.registrar_pecas",
        "mecanico.registrar_fotos",
      ]}
    >
      <PageHeader
        title="Meus serviços"
        description="Serviços atribuídos ao seu login — perfis fictícios são geridos pela gerência"
      />

      {feedback && (
        <p className="mb-4 rounded-lg border border-border bg-surface-hover px-4 py-3 text-sm text-muted-foreground">
          {feedback}
        </p>
      )}

      <DataTable
        headers={["OS", "Cliente", "Veículo", "Serviço", "Data", "Status", "Ações"]}
        rows={orders.map((s) => [
          s.id,
          s.clientName,
          s.vehicle,
          s.service,
          new Date(s.date).toLocaleDateString("pt-BR"),
          orderStatusLabels[s.status],
          s.status !== "concluido" ? (
            <ActionButton
              key={s.id}
              label="Atualizar status"
              variant="primary"
              onClick={() => {
                setSelected(s);
                setFeedback("");
              }}
            />
          ) : (
            <span key={`done-${s.id}`} className="text-xs text-muted">
              Concluído
            </span>
          ),
        ])}
      />

      {selected && (
        <div className="mt-6 rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-1 font-semibold">Atualizar status — {selected.id}</h3>
          <p className="mb-4 text-sm text-muted">
            {selected.clientName} · {selected.service}
          </p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((st) => (
              <ActionButton
                key={st.value}
                label={st.label}
                variant={st.value === "concluido" ? "success" : "secondary"}
                onClick={() => void applyStatus(st.value)}
              />
            ))}
            <ActionButton label="Cancelar" onClick={() => setSelected(null)} />
          </div>
        </div>
      )}
    </PermissionGuard>
  );
}
