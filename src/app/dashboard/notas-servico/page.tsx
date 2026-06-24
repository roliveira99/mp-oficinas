"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionButton, DataTable, PageHeader } from "@/components/dashboard/DashboardUI";
import { DocumentLineBuilder } from "@/components/dashboard/DocumentLineBuilder";
import { MechanicAssigneeSelect } from "@/components/dashboard/MechanicAssigneeSelect";
import { PermissionGuard } from "@/components/dashboard/PermissionGuard";
import { ServiceNoteDocumentActions } from "@/components/documents/ServiceNoteDocument";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiAddVehicle, fetchCrm } from "@/lib/api/crm-client";
import { serviceNoteStatusColors, serviceNoteStatusLabels } from "@/lib/labels";
import {
  getServiceNoteTemplate,
  resolveServiceNoteIssuer,
  serviceNoteToPayload,
} from "@/lib/service-note-document";
import type { BudgetRecord } from "@/types/budget";
import type { MechanicAssignee, MechanicKind, WorkshopClient, WorkshopVehicle } from "@/types/client";
import type { DocumentLineItem } from "@/types/document-line";
import type { ServiceNoteRecord } from "@/types/service-note";

export default function NotasServicoPage() {
  const { user } = useAuth();
  const workshopId = user?.workshopId ?? "1";
  const workshopName = user?.workshopName ?? "Oficina";

  const [notes, setNotes] = useState<ServiceNoteRecord[]>([]);
  const [approvedBudgets, setApprovedBudgets] = useState<BudgetRecord[]>([]);
  const [vehicles, setVehicles] = useState<WorkshopVehicle[]>([]);
  const [clients, setClients] = useState<WorkshopClient[]>([]);
  const [assignees, setAssignees] = useState<MechanicAssignee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [previewNote, setPreviewNote] = useState<ServiceNoteRecord | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [newPlate, setNewPlate] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newYear, setNewYear] = useState("");
  const [lineItems, setLineItems] = useState<DocumentLineItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [mechanicId, setMechanicId] = useState("");
  const [mechanicKind, setMechanicKind] = useState<MechanicKind>("fictional");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const issuer = useMemo(
    () => resolveServiceNoteIssuer(workshopId, workshopName),
    [workshopId, workshopName]
  );
  const template = useMemo(() => getServiceNoteTemplate(workshopId), [workshopId]);

  const previewPayload = previewNote ? serviceNoteToPayload(previewNote) : null;
  const previewClientPhone = previewNote?.clientId
    ? clients.find((c) => c.id === previewNote.clientId)?.phone
    : undefined;

  const refresh = useCallback(async () => {
    const [crm, notesRes, budgetsRes] = await Promise.all([
      fetchCrm(),
      fetch("/api/service-notes"),
      fetch("/api/budgets?status=aprovado"),
    ]);
    setVehicles(crm.vehicles);
    setClients(crm.clients);
    setAssignees(crm.assignees);
    if (notesRes.ok) {
      const data = (await notesRes.json()) as { notes: ServiceNoteRecord[] };
      setNotes(data.notes);
    }
    if (budgetsRes.ok) {
      const data = (await budgetsRes.json()) as { budgets: BudgetRecord[] };
      setApprovedBudgets(data.budgets.filter((b) => !b.serviceNoteId));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function emitFromBudget(budgetId: string) {
    setError("");
    const res = await fetch("/api/service-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "from-budget", budgetId }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!data.ok) {
      setError(data.error ?? "Não foi possível emitir a nota.");
      return;
    }
    setMessage("Nota emitida a partir do orçamento aprovado.");
    await refresh();
  }

  async function handleAddVehicle(e: React.FormEvent) {
    e.preventDefault();
    const result = await apiAddVehicle({ plate: newPlate, model: newModel, year: newYear || undefined });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setVehicleId(result.vehicle.id);
    setNewPlate("");
    setNewModel("");
    setNewYear("");
    setShowVehicleForm(false);
    await refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const assignee = assignees.find((a) => a.id === mechanicId && a.kind === mechanicKind);
    if (!vehicleId || !assignee || lineItems.length === 0) {
      setError("Preencha veículo, mecânico e itens.");
      return;
    }

    const res = await fetch("/api/service-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        vehicleId,
        lineItems,
        paymentMethods,
        mechanicId,
        mechanicKind,
        mechanicName: assignee.name,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!data.ok) {
      setError(data.error ?? "Erro ao emitir nota.");
      return;
    }

    setMessage("Nota de serviço emitida e lançada como paga no financeiro.");
    setShowForm(false);
    setVehicleId("");
    setLineItems([]);
    setPaymentMethods([]);
    await refresh();
  }

  async function handleCancelNote(note: ServiceNoteRecord) {
    if (note.status === "cancelada") return;
    const confirmed = window.confirm(
      "Cancelar esta nota? O valor será removido do financeiro, o estoque das peças será reposto e orçamentos vinculados voltarão para aprovado."
    );
    if (!confirmed) return;

    setError("");
    const res = await fetch("/api/service-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel", noteId: note.id }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!data.ok) {
      setError(data.error ?? "Não foi possível cancelar a nota.");
      return;
    }
    if (previewNote?.id === note.id) setPreviewNote(null);
    setMessage("Nota cancelada. Valores e estoque foram ajustados.");
    await refresh();
  }

  return (
    <PermissionGuard permissions={["owner.emissao_pdf", "gerencia.emissao_notas"]}>
      <PageHeader
        title="Notas de serviço"
        description="Documento oficial do serviço — ao emitir, entra automaticamente como paga no financeiro e na receita do negócio"
        actions={
          <ActionButton
            label={showForm ? "Fechar" : "+ Nova nota"}
            variant="primary"
            onClick={() => setShowForm(!showForm)}
          />
        }
      />

      {message && <p className="dash-alert mb-4">{message}</p>}
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {approvedBudgets.length > 0 && (
        <div className="card mb-6 p-5">
          <h3 className="mb-3 font-semibold">Orçamentos aprovados</h3>
          <p className="mb-4 text-sm text-muted">
            Converta orçamentos aceitos pelo cliente em nota de serviço.
          </p>
          <DataTable
            headers={["ID", "Veículo", "Total", "Mecânico", "Ações"]}
            rows={approvedBudgets.map((b) => [
              b.id.slice(-8).toUpperCase(),
              b.vehiclePlate ?? "—",
              `R$ ${b.total.toFixed(2)}`,
              b.mechanicName ?? "—",
              <ActionButton
                key={b.id}
                label="Emitir nota"
                variant="success"
                onClick={() => void emitFromBudget(b.id)}
              />,
            ])}
          />
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-4 p-5">
          <h3 className="font-semibold">Nova nota de serviço</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <select
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Veículo *</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} — {v.model}{v.year ? ` (${v.year})` : ""}
                  </option>
                ))}
              </select>
              <ActionButton
                label={showVehicleForm ? "Cancelar cadastro" : "+ Cadastrar veículo"}
                variant="secondary"
                onClick={() => setShowVehicleForm(!showVehicleForm)}
              />
            </div>
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

          {showVehicleForm && (
            <div className="rounded-lg border border-border p-4">
              <p className="mb-2 text-sm font-medium">Cadastro rápido de veículo</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <input required value={newPlate} onChange={(e) => setNewPlate(e.target.value.toUpperCase())} className="input-field" placeholder="Placa" />
                <input required value={newModel} onChange={(e) => setNewModel(e.target.value)} className="input-field" placeholder="Modelo" />
                <input value={newYear} onChange={(e) => setNewYear(e.target.value)} className="input-field" placeholder="Ano" />
              </div>
              <button type="button" onClick={(e) => void handleAddVehicle(e)} className="btn btn-secondary mt-2 text-sm">
                Salvar veículo
              </button>
            </div>
          )}

          <DocumentLineBuilder
            lineItems={lineItems}
            onChange={setLineItems}
            paymentMethods={paymentMethods}
            onPaymentMethodsChange={setPaymentMethods}
          />
          <button type="submit" className="btn btn-primary">
            Emitir nota e concluir serviço
          </button>
        </form>
      )}

      <DataTable
        headers={["Nota", "Veículo", "Mecânico", "Total", "Status", "Comissão", "Data", "Ações"]}
        rows={notes.map((n) => [
          n.id.slice(-8).toUpperCase(),
          n.vehiclePlate ?? "—",
          n.mechanicName ?? "—",
          `R$ ${n.total.toFixed(2)}`,
          <span
            key={`st-${n.id}`}
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${serviceNoteStatusColors[n.status]}`}
          >
            {serviceNoteStatusLabels[n.status]}
          </span>,
          n.commissionAmount != null ? `R$ ${n.commissionAmount.toFixed(2)}` : "—",
          new Date(n.issuedAt).toLocaleDateString("pt-BR"),
          <div key={`act-${n.id}`} className="flex flex-wrap gap-1">
            {n.status !== "cancelada" && (
              <ActionButton
                label="Ver / Enviar"
                variant="primary"
                onClick={() => setPreviewNote(n)}
              />
            )}
            {n.status !== "cancelada" && (
              <ActionButton
                label="Cancelar"
                onClick={() => void handleCancelNote(n)}
              />
            )}
          </div>,
        ])}
      />

      {previewNote && previewPayload && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Nota de serviço"
        >
          <div className="w-full max-w-3xl rounded-xl bg-surface p-5 shadow-xl sm:p-6">
            <ServiceNoteDocumentActions
              payload={previewPayload}
              issuer={issuer}
              template={template}
              clientPhone={previewClientPhone}
              onClose={() => setPreviewNote(null)}
            />
          </div>
        </div>
      )}
    </PermissionGuard>
  );
}
