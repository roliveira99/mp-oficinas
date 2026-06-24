"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionButton, DataTable, PageHeader, TabPanel } from "@/components/dashboard/DashboardUI";
import { DocumentLineBuilder } from "@/components/dashboard/DocumentLineBuilder";
import { PermissionGuard } from "@/components/dashboard/PermissionGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchCrm } from "@/lib/api/crm-client";
import { getOperationalConfig } from "@/lib/verticals/operational";
import { budgetStatusColors, budgetStatusLabels } from "@/lib/labels";
import type { BudgetRecord } from "@/types/budget";
import type { DocumentLineItem } from "@/types/document-line";
import type { WorkshopVehicle } from "@/types/client";

export default function MecanicoOrcamentosPage() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [vehicles, setVehicles] = useState<WorkshopVehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [lineItems, setLineItems] = useState<DocumentLineItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const ops = getOperationalConfig(user?.workshopVertical);

  const refresh = useCallback(async () => {
    const [budgetRes, crm] = await Promise.all([fetch("/api/budgets"), fetchCrm()]);
    if (budgetRes.ok) {
      const data = (await budgetRes.json()) as { budgets: BudgetRecord[] };
      setBudgets(data.budgets);
    }
    setVehicles(crm.vehicles);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if ((ops.assets.requiredForBudget && !vehicleId) || lineItems.length === 0) {
      setError(
        ops.assets.requiredForBudget
          ? `Selecione ${ops.assets.singularLabel.toLowerCase()} e adicione itens.`
          : "Adicione itens ao orçamento."
      );
      return;
    }

    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        vehicleId: vehicleId || null,
        lineItems,
        paymentMethods,
        mechanicId: user?.id,
        mechanicKind: "platform",
        mechanicName: user?.name,
        notes,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!data.ok) {
      setError(data.error ?? "Erro ao enviar orçamento.");
      return;
    }

    setMessage("Orçamento enviado para aprovação da gerência ou dono.");
    setShowForm(false);
    setVehicleId("");
    setLineItems([]);
    setNotes("");
    await refresh();
  }

  return (
    <PermissionGuard permissions={["mecanico.criar_orcamento"]}>
      <PageHeader
        title="Meus orçamentos"
        description="Monte orçamentos para aprovação — não entram no financeiro até virarem nota"
        actions={
          <ActionButton label={showForm ? "Fechar" : "+ Novo orçamento"} variant="primary" onClick={() => setShowForm(!showForm)} />
        }
      />

      {message && <p className="dash-alert mb-4">{message}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-4 p-5">
          {ops.assets.enabled && (
            <select
              required={ops.assets.requiredForBudget}
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="input-field max-w-md"
            >
              <option value="">
                {ops.assets.singularLabel}
                {ops.assets.requiredForBudget ? " *" : " (opcional)"}
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.referenceKey || v.plate} — {v.label || v.model}
                </option>
              ))}
            </select>
          )}
          <DocumentLineBuilder lineItems={lineItems} onChange={setLineItems} paymentMethods={paymentMethods} onPaymentMethodsChange={setPaymentMethods} />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field min-h-[60px]" placeholder="Observações para a gerência (opcional)" />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" className="btn btn-primary">Enviar para aprovação</button>
        </form>
      )}

      <DataTable
        headers={["ID", ops.assets.singularLabel, "Total", "Status", "Data"]}
        rows={budgets.map((b) => [
          b.id.slice(-8).toUpperCase(),
          b.vehiclePlate ?? "—",
          `R$ ${b.total.toFixed(2)}`,
          <span key={b.id} className={`rounded-full px-2 py-0.5 text-xs ${budgetStatusColors[b.status]}`}>{budgetStatusLabels[b.status]}</span>,
          new Date(b.createdAt).toLocaleDateString("pt-BR"),
        ])}
      />
    </PermissionGuard>
  );
}
