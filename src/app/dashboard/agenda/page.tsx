"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionButton, DataTable } from "@/components/dashboard/DashboardUI";
import { PageHeader } from "@/components/dashboard/DashboardUI";
import { PermissionGuard } from "@/components/dashboard/PermissionGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiAgendaAction, fetchAllAgenda } from "@/lib/api/crm-client";
import { agendaPermissions } from "@/lib/permissions";
import type { AgendaRequest } from "@/types/workshop";

const statusLabels: Record<AgendaRequest["status"], string> = {
  pendente: "Aguardando",
  aprovado: "Confirmado",
  recusado: "Recusado",
};

const statusColors: Record<AgendaRequest["status"], string> = {
  pendente: "dash-badge",
  aprovado: "dash-badge font-medium text-foreground",
  recusado: "dash-badge opacity-60",
};

function formatDateKey(iso: string) {
  return iso.slice(0, 10);
}

export default function AgendaPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AgendaRequest[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [feedback, setFeedback] = useState("");

  const refresh = useCallback(async () => {
    const data = await fetchAllAgenda();
    setRequests(data.requests);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, user?.workshopId]);

  const pending = requests.filter((r) => r.status === "pendente");
  const approved = requests.filter((r) => r.status === "aprovado");

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

  async function handleAction(id: string, action: "approve" | "reject") {
    setFeedback("");
    const result = await apiAgendaAction(action, id);
    if (result.whatsappUrl) {
      window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      setFeedback("Agendamento aprovado — WhatsApp aberto para confirmar com o cliente.");
    } else if (action === "reject") {
      setFeedback("Solicitação recusada.");
    }
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

  return (
    <PermissionGuard permissions={agendaPermissions}>
      <PageHeader
        title="Agenda"
        description="Solicitações do site público e horários confirmados — aprove e avise o cliente no WhatsApp"
      />

      {feedback && <p className="dash-alert">{feedback}</p>}

      {pending.length > 0 && (
        <section className="card mb-6 p-5">
          <h2 className="font-semibold text-foreground">Solicitações aguardando aprovação ({pending.length})</h2>
          <p className="mt-1 text-sm text-muted">
            Clientes pediram horário pelo site — aprove para abrir o WhatsApp com mensagem pronta.
          </p>
          <ul className="mt-4 divide-y divide-border">
            {pending.map((req) => (
              <li key={req.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">{req.clientName}</p>
                  <p className="text-muted">
                    {req.service} — {req.preferredDate} às {req.preferredTime}
                    {req.vehicle ? ` · ${req.vehicle}` : ""}
                  </p>
                  <p className="text-xs text-muted">{req.clientPhone}</p>
                </div>
                <div className="flex gap-2">
                  <ActionButton
                    label="Aprovar + WhatsApp"
                    variant="primary"
                    onClick={() => void handleAction(req.id, "approve")}
                  />
                  <ActionButton label="Recusar" onClick={() => void handleAction(req.id, "reject")} />
                </div>
              </li>
            ))}
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
            const d = new Date(dateKey + "T12:00:00");
            const label = d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" });
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
                <span className="block capitalize">{label}</span>
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
          <DataTable
            headers={["Horário", "Cliente", "Serviço", "Veículo", "Status", "Contato"]}
            rows={dayRequests.map((a) => [
              a.preferredTime,
              a.clientName,
              a.service,
              a.vehicle ?? "—",
              <span
                key={`st-${a.id}`}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[a.status]}`}
              >
                {statusLabels[a.status]}
              </span>,
              a.clientPhone,
            ])}
          />
        )}
      </section>

      {approved.length > 0 && (
        <section className="card p-5">
          <h2 className="font-semibold text-foreground">Próximos confirmados</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {approved.slice(0, 5).map((r) => (
              <li key={r.id} className="flex justify-between gap-2 border-b border-border pb-2 last:border-0">
                <span>
                  {r.preferredDate} {r.preferredTime} — {r.clientName} ({r.service})
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PermissionGuard>
  );
}
