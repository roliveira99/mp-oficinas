"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionButton, PageHeader } from "@/components/dashboard/DashboardUI";
import { PermissionGuard } from "@/components/dashboard/PermissionGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiAgendaAction, fetchAllAgenda } from "@/lib/api/crm-client";
import { agendaPermissions } from "@/lib/permissions";
import type { AgendaRequest } from "@/types/workshop";

const statusLabels: Record<AgendaRequest["status"], string> = {
  pendente: "Aguardando",
  aprovado: "Confirmado",
  alteracao_pendente: "Alteração proposta",
  recusado: "Recusado",
};

const statusColors: Record<AgendaRequest["status"], string> = {
  pendente: "dash-badge",
  aprovado: "dash-badge font-medium text-foreground",
  alteracao_pendente: "dash-badge font-medium text-foreground",
  recusado: "dash-badge opacity-60",
};

function formatDateKey(iso: string) {
  return iso.slice(0, 10);
}

function formatDateBr(date: string) {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
}

export default function AgendaPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AgendaRequest[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [feedback, setFeedback] = useState("");
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");

  const refresh = useCallback(async () => {
    const data = await fetchAllAgenda();
    setRequests(data.requests);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, user?.workshopId]);

  const pending = requests.filter((r) => r.status === "pendente");
  const changePending = requests.filter((r) => r.status === "alteracao_pendente");
  const active = requests.filter((r) => r.status === "aprovado" || r.status === "alteracao_pendente");

  const datesWithEvents = useMemo(() => {
    const set = new Set<string>();
    for (const r of requests) {
      if (r.status !== "recusado") set.add(formatDateKey(r.preferredDate));
    }
    return set;
  }, [requests]);

  const dayRequests = useMemo(
    () =>
      requests
        .filter((r) => formatDateKey(r.preferredDate) === selectedDate && r.status !== "recusado")
        .sort((a, b) => a.preferredTime.localeCompare(b.preferredTime)),
    [requests, selectedDate]
  );

  async function runAction(
    id: string,
    action: "approve" | "reject" | "confirm-change" | "cancel-change"
  ) {
    setFeedback("");
    const result = await apiAgendaAction(action, id);
    if (result.whatsappUrl) {
      window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
    }
    if (action === "approve") {
      setFeedback("Agendamento aprovado — WhatsApp aberto para o cliente.");
    } else if (action === "reject") {
      setFeedback("Solicitação recusada — WhatsApp aberto para avisar o cliente.");
    } else if (action === "confirm-change") {
      setFeedback("Alteração confirmada — WhatsApp aberto com o novo horário.");
      setRescheduleId(null);
    } else if (action === "cancel-change") {
      setFeedback("Alteração cancelada — horário original mantido.");
      setRescheduleId(null);
    }
    if (result.error) setFeedback(result.error);
    await refresh();
  }

  function openReschedule(req: AgendaRequest) {
    setRescheduleId(req.id);
    setProposedDate(req.proposedDate ?? req.preferredDate);
    setProposedTime(req.proposedTime ?? req.preferredTime);
  }

  async function submitProposeChange(id: string) {
    if (!proposedDate || !proposedTime) {
      setFeedback("Informe a nova data e horário.");
      return;
    }
    setFeedback("");
    const result = await apiAgendaAction("propose-change", id, {
      proposedDate,
      proposedTime,
    });
    if (result.whatsappUrl) {
      window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      setFeedback("Proposta enviada — WhatsApp aberto para o cliente confirmar.");
    } else {
      setFeedback(result.error ?? "Não foi possível propor alteração.");
    }
    setRescheduleId(null);
    await refresh();
  }

  const weekStart = useMemo(() => {
    const d = new Date(selectedDate + "T12:00:00");
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  }, [selectedDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, [weekStart]);

  function renderRequestCard(req: AgendaRequest, showApprove = false) {
    return (
      <li key={req.id} className="py-3">
        <div className="flex flex-wrap items-start justify-between gap-3 text-sm">
          <div>
            <p className="font-medium">{req.clientName}</p>
            <p className="text-muted">
              {req.service} — {req.preferredDate} às {req.preferredTime}
              {req.vehicle ? ` · ${req.vehicle}` : ""}
            </p>
            {req.status === "alteracao_pendente" && req.proposedDate && req.proposedTime && (
              <p className="mt-1 text-xs font-medium text-accent">
                Nova data proposta: {req.proposedDate} às {req.proposedTime}
              </p>
            )}
            <p className="text-xs text-muted">{req.clientPhone}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton
              label="WhatsApp"
              onClick={() =>
                void apiAgendaAction("whatsapp", req.id).then((r) => {
                  if (r.whatsappUrl) window.open(r.whatsappUrl, "_blank", "noopener,noreferrer");
                })
              }
            />
            {showApprove && (
              <>
                <ActionButton
                  label="Aprovar + WhatsApp"
                  variant="primary"
                  onClick={() => void runAction(req.id, "approve")}
                />
                <ActionButton label="Recusar" onClick={() => void runAction(req.id, "reject")} />
              </>
            )}
            {req.status === "aprovado" || req.status === "alteracao_pendente" ? (
              <ActionButton label="Alterar horário" onClick={() => openReschedule(req)} />
            ) : null}
            {req.status === "alteracao_pendente" && (
              <>
                <ActionButton
                  label="Cliente aceitou"
                  variant="success"
                  onClick={() => void runAction(req.id, "confirm-change")}
                />
                <ActionButton
                  label="Manter original"
                  onClick={() => void runAction(req.id, "cancel-change")}
                />
              </>
            )}
          </div>
        </div>

        {rescheduleId === req.id && (
          <div className="mt-3 rounded-lg border border-border bg-surface-hover p-4">
            <p className="mb-2 text-sm font-medium">Propor nova data e horário</p>
            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                className="input-field w-auto"
              />
              <input
                type="time"
                value={proposedTime}
                onChange={(e) => setProposedTime(e.target.value)}
                className="input-field w-auto"
              />
              <ActionButton
                label="Enviar proposta no WhatsApp"
                variant="primary"
                onClick={() => void submitProposeChange(req.id)}
              />
              <ActionButton label="Cancelar" onClick={() => setRescheduleId(null)} />
            </div>
          </div>
        )}
      </li>
    );
  }

  return (
    <PermissionGuard permissions={agendaPermissions}>
      <PageHeader
        title="Agenda"
        description="Aprove solicitações, fale com o cliente no WhatsApp a qualquer momento e proponha alteração de data/horário"
      />

      {feedback && <p className="dash-alert mb-4">{feedback}</p>}

      {pending.length > 0 && (
        <section className="card mb-6 p-5">
          <h2 className="font-semibold text-foreground">
            Solicitações aguardando aprovação ({pending.length})
          </h2>
          <ul className="mt-4 divide-y divide-border">{pending.map((r) => renderRequestCard(r, true))}</ul>
        </section>
      )}

      {changePending.length > 0 && (
        <section className="card mb-6 p-5">
          <h2 className="font-semibold text-foreground">
            Aguardando resposta do cliente sobre alteração ({changePending.length})
          </h2>
          <p className="mt-1 text-sm text-muted">
            Você propôs um novo horário — quando o cliente confirmar, clique em &quot;Cliente aceitou&quot;.
          </p>
          <ul className="mt-4 divide-y divide-border">
            {changePending.map((r) => renderRequestCard(r))}
          </ul>
        </section>
      )}

      <section className="card mb-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-foreground">Calendário semanal</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field w-auto"
          />
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {weekDays.map((dateKey) => {
            const isSelected = dateKey === selectedDate;
            const hasEvents = datesWithEvents.has(dateKey);
            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setSelectedDate(dateKey)}
                className={`rounded-lg border px-2 py-3 text-center text-xs transition-colors ${
                  isSelected
                    ? "border-border-strong bg-surface font-semibold text-foreground shadow-[inset_0_0_0_1px_var(--dash-border-strong)]"
                    : "border-border hover:bg-surface-hover"
                }`}
              >
                <span className="block capitalize">{formatDateBr(dateKey)}</span>
                {hasEvents && (
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-border-strong" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 font-semibold text-foreground">
          {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </h2>
        {dayRequests.length === 0 ? (
          <p className="text-sm text-muted">Nenhum agendamento neste dia.</p>
        ) : (
          <div className="space-y-4">
            {dayRequests.map((req) => (
              <div key={req.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {req.preferredTime} — {req.clientName}
                    </p>
                    <p className="text-muted">
                      {req.service}
                      {req.vehicle ? ` · ${req.vehicle}` : ""}
                    </p>
                    {req.status === "alteracao_pendente" && req.proposedDate && req.proposedTime && (
                      <p className="mt-1 text-xs text-accent">
                        Proposta: {req.proposedDate} às {req.proposedTime}
                      </p>
                    )}
                    <span
                      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[req.status]}`}
                    >
                      {statusLabels[req.status]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <ActionButton
                      label="WhatsApp"
                      onClick={() =>
                        void apiAgendaAction("whatsapp", req.id).then((r) => {
                          if (r.whatsappUrl) window.open(r.whatsappUrl, "_blank", "noopener,noreferrer");
                        })
                      }
                    />
                    {req.status === "aprovado" || req.status === "alteracao_pendente" ? (
                      <ActionButton label="Alterar horário" onClick={() => openReschedule(req)} />
                    ) : null}
                    {req.status === "alteracao_pendente" && (
                      <>
                        <ActionButton
                          label="Cliente aceitou"
                          variant="success"
                          onClick={() => void runAction(req.id, "confirm-change")}
                        />
                        <ActionButton
                          label="Manter original"
                          onClick={() => void runAction(req.id, "cancel-change")}
                        />
                      </>
                    )}
                  </div>
                </div>
                {rescheduleId === req.id && (
                  <div className="mt-3 rounded-lg border border-border bg-surface-hover p-4">
                    <p className="mb-2 text-sm font-medium">Propor nova data e horário</p>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="date"
                        value={proposedDate}
                        onChange={(e) => setProposedDate(e.target.value)}
                        className="input-field w-auto"
                      />
                      <input
                        type="time"
                        value={proposedTime}
                        onChange={(e) => setProposedTime(e.target.value)}
                        className="input-field w-auto"
                      />
                      <ActionButton
                        label="Enviar proposta no WhatsApp"
                        variant="primary"
                        onClick={() => void submitProposeChange(req.id)}
                      />
                      <ActionButton label="Cancelar" onClick={() => setRescheduleId(null)} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {active.length > 0 && (
        <section className="card p-5">
          <h2 className="font-semibold text-foreground">Agendamentos ativos</h2>
          <ul className="mt-3 divide-y divide-border">
            {active.map((r) => renderRequestCard(r))}
          </ul>
        </section>
      )}
    </PermissionGuard>
  );
}
