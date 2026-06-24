"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionButton, DataTable, PageHeader } from "@/components/dashboard/DashboardUI";
import {
  MechanicAssigneeSelect,
  MechanicKindBadge,
} from "@/components/dashboard/MechanicAssigneeSelect";
import { PermissionGuard } from "@/components/dashboard/PermissionGuard";
import { DocumentLineBuilder } from "@/components/dashboard/DocumentLineBuilder";
import { useAuth } from "@/components/auth/AuthProvider";
import { budgetStatusColors, budgetStatusLabels } from "@/lib/labels";
import {
  buildBudgetPrintHtml,
  buildBudgetShareText,
  printDocument,
  shareViaEmail,
  shareViaWhatsApp,
} from "@/lib/document-share";
import { fetchCrm } from "@/lib/api/crm-client";
import { getOperationalConfig } from "@/lib/verticals/operational";
import type { BudgetRecord } from "@/types/budget";
import type { MechanicAssignee, MechanicKind, WorkshopVehicle } from "@/types/client";
import type { DocumentLineItem } from "@/types/document-line";

export default function OrcamentosPage() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [vehicles, setVehicles] = useState<WorkshopVehicle[]>([]);
  const [assignees, setAssignees] = useState<MechanicAssignee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [lineItems, setLineItems] = useState<DocumentLineItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [mechanicId, setMechanicId] = useState("");
  const [mechanicKind, setMechanicKind] = useState<MechanicKind>("fictional");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canApprove = user?.role === "dono" || user?.role === "gerencia";
  const ops = getOperationalConfig(user?.workshopVertical);

  const refresh = useCallback(async () => {
    const [budgetRes, crm] = await Promise.all([
      fetch("/api/budgets"),
      fetchCrm(),
    ]);
    if (budgetRes.ok) {
      const data = (await budgetRes.json()) as { budgets: BudgetRecord[] };
      setBudgets(data.budgets.filter((b) => b.status !== "convertido"));
    }
    setAssignees(crm.assignees);
    setVehicles(crm.vehicles);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, user?.workshopId]);

  function resetForm() {
    setEditingId(null);
    setVehicleId("");
    setLineItems([]);
    setPaymentMethods([]);
    setMechanicId("");
    setShowForm(false);
    setError("");
  }

  function startEdit(b: BudgetRecord) {
    setEditingId(b.id);
    setVehicleId(b.vehicleId ?? "");
    setLineItems(b.lineItems);
    setPaymentMethods(b.paymentMethods);
    setMechanicId(b.mechanicId ?? "");
    setMechanicKind(b.mechanicKind ?? "fictional");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (ops.assets.requiredForBudget && !vehicleId) {
      setError(`Selecione ${ops.assets.singularLabel.toLowerCase()}.`);
      return;
    }
    if (lineItems.length === 0) {
      setError("Adicione ao menos um serviço ou peça.");
      return;
    }
    if (!mechanicId) {
      setError("Selecione o mecânico responsável.");
      return;
    }

    const assignee = assignees.find((a) => a.id === mechanicId && a.kind === mechanicKind);
    const payload = {
      vehicleId: vehicleId || null,
      lineItems,
      paymentMethods,
      mechanicId,
      mechanicKind,
      mechanicName: assignee?.name,
    };

    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        editingId
          ? { action: "update", budgetId: editingId, ...payload }
          : { action: "create", ...payload }
      ),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; budget?: BudgetRecord };
    if (!data.ok) {
      setError(data.error ?? "Erro ao salvar orçamento.");
      return;
    }

    setMessage(editingId ? "Orçamento atualizado." : `Orçamento ${data.budget?.id} criado.`);
    resetForm();
    await refresh();
  }

  async function budgetAction(action: string, budgetId: string) {
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, budgetId }),
    });
    await refresh();
  }

  function sendBudget(b: BudgetRecord, channel: "whatsapp" | "email" | "print") {
    const text = buildBudgetShareText({
      id: b.id,
      workshopName: user?.workshopName ?? "Oficina",
      vehiclePlate: b.vehiclePlate,
      vehicleModel: b.vehicleModel,
      lineItems: b.lineItems,
      total: b.total,
    });
    if (channel === "whatsapp") shareViaWhatsApp(text);
    else if (channel === "email") shareViaEmail(`Orçamento ${b.id}`, text);
    else printDocument(`Orçamento ${b.id}`, buildBudgetPrintHtml({
      id: b.id,
      workshopName: user?.workshopName ?? "Oficina",
      vehiclePlate: b.vehiclePlate,
      vehicleModel: b.vehicleModel,
      lineItems: b.lineItems,
      total: b.total,
    }));
    void budgetAction("sent", b.id);
    setMessage("Orçamento marcado como enviado ao cliente.");
  }

  const visible = budgets;

  return (
    <PermissionGuard
      permissions={[
        "owner.aprovar_orcamentos",
        "owner.criar_orcamento",
        "gerencia.aprovar_orcamentos",
        "gerencia.criar_orcamento",
        "gerencia.alterar_orcamentos",
      ]}
    >
      <PageHeader
        title="Orçamentos"
        description="Propostas comerciais — não entram no financeiro até virarem nota de serviço após aprovação do cliente"
        actions={
          <ActionButton
            label={showForm ? "Fechar" : "+ Novo orçamento"}
            variant="primary"
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
          />
        }
      />

      {message && <p className="dash-alert mb-4">{message}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-4 p-5">
          <h3 className="font-semibold">{editingId ? "Editar orçamento" : "Novo orçamento"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {ops.assets.enabled && (
              <select
                required={ops.assets.requiredForBudget}
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="input-field"
              >
                <option value="">
                  {ops.assets.singularLabel}
                  {ops.assets.requiredForBudget ? " *" : " (opcional)"}
                </option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.referenceKey || v.plate} — {v.label || v.model}
                    {v.year ? ` (${v.year})` : ""}
                  </option>
                ))}
              </select>
            )}
            <MechanicAssigneeSelect
              assignees={assignees}
              value={mechanicId}
              kind={mechanicKind}
              onChange={(id, kind) => {
                setMechanicId(id);
                setMechanicKind(kind);
              }}
              required
            />
          </div>
          <DocumentLineBuilder
            lineItems={lineItems}
            onChange={setLineItems}
            paymentMethods={paymentMethods}
            onPaymentMethodsChange={setPaymentMethods}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">
              {editingId ? "Salvar alterações" : "Criar orçamento"}
            </button>
            <ActionButton label="Cancelar" variant="secondary" onClick={resetForm} />
          </div>
        </form>
      )}

      <DataTable
        headers={["ID", ops.assets.singularLabel, "Responsável", "Total", "Status", "Enviado", "Ações"]}
        rows={visible.map((b) => [
          b.id.slice(-8).toUpperCase(),
          b.vehiclePlate ? `${b.vehiclePlate} — ${b.vehicleModel ?? ""}` : "—",
          <span key={`m-${b.id}`} className="inline-flex flex-wrap items-center gap-2">
            {b.mechanicName ?? "—"}
            {b.mechanicKind && <MechanicKindBadge kind={b.mechanicKind} />}
          </span>,
          `R$ ${b.total.toFixed(2)}`,
          <span key={`s-${b.id}`} className={`rounded-full px-2 py-0.5 text-xs font-medium ${budgetStatusColors[b.status]}`}>
            {budgetStatusLabels[b.status]}
          </span>,
          b.sentAt ? new Date(b.sentAt).toLocaleDateString("pt-BR") : "—",
          <div key={`a-${b.id}`} className="flex flex-wrap gap-1">
            {canApprove && b.status === "aguardando_aprovacao" && (
              <>
                <ActionButton label="Aceitar" variant="success" onClick={() => void budgetAction("approve", b.id)} />
                <ActionButton label="Reprovar" onClick={() => void budgetAction("reject", b.id)} />
              </>
            )}
            {b.status !== "convertido" && b.status !== "rejeitado" && (
              <ActionButton label="Editar" onClick={() => startEdit(b)} />
            )}
            <ActionButton label="WhatsApp" onClick={() => sendBudget(b, "whatsapp")} />
            <ActionButton label="E-mail" onClick={() => sendBudget(b, "email")} />
            <ActionButton label="Imprimir" onClick={() => sendBudget(b, "print")} />
          </div>,
        ])}
      />

      <p className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        Orçamentos aprovados podem ser convertidos em <strong>nota de serviço</strong> na tela Notas de serviço — só então entram no financeiro e na produtividade do mecânico.
      </p>
    </PermissionGuard>
  );
}
