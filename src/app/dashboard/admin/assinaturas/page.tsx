"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionButton, DataTable, PageHeader } from "@/components/dashboard/DashboardUI";
import { PermissionGuard } from "@/components/dashboard/PermissionGuard";
import { StatCard } from "@/components/dashboard/StatCard";
import { subscriptionMessage } from "@/lib/brand";
import { shareViaWhatsApp } from "@/lib/document-share";

interface SubscriptionRow {
  id: string;
  workshopId: string;
  workshopName: string;
  monthlyValue: number;
  nextDueAt: string;
  status: string;
  paid: boolean;
  paymentLink: string | null;
  lastChargedAt: string | null;
  daysSinceCharge: number | null;
}

export default function AdminAssinaturasPage() {
  const [items, setItems] = useState<SubscriptionRow[]>([]);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/subscriptions");
    if (res.ok) {
      const data = (await res.json()) as { subscriptions: SubscriptionRow[] };
      setItems(data.subscriptions);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function post(action: string, payload: Record<string, unknown>) {
    await fetch("/api/admin/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    await refresh();
  }

  const active = items.filter((s) => s.status === "ativa");
  const overdue = items.filter((s) => s.status === "atrasada" || (!s.paid && new Date(s.nextDueAt) < new Date()));
  const mrr = active.reduce((sum, s) => sum + s.monthlyValue, 0);

  return (
    <PermissionGuard permissions={["admin.controle_assinaturas"]}>
      <PageHeader
        title="Controle financeiro — Assinaturas"
        description="Oficinas cadastradas no sistema — cobrança, lembretes e status de pagamento"
      />

      {message && <p className="dash-alert mb-4">{message}</p>}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="MRR (receita mensal)" value={`R$ ${mrr.toLocaleString("pt-BR")}`} icon="wallet" />
        <StatCard label="Assinaturas ativas" value={active.length} icon="credit-card" />
        <StatCard label="Inadimplentes" value={overdue.length} icon="chart" trendPositive={false} />
      </div>

      <DataTable
        headers={["Oficina", "Valor/mês", "Vencimento", "Status", "Pago?", "Cobrança", "Ações"]}
        rows={items.map((s) => [
          s.workshopName,
          `R$ ${s.monthlyValue.toFixed(2)}`,
          new Date(s.nextDueAt).toLocaleDateString("pt-BR"),
          s.status,
          s.paid ? "Sim" : "Não",
          s.daysSinceCharge != null ? `${s.daysSinceCharge} dias` : "—",
          <div key={s.id} className="flex flex-wrap gap-1">
            <ActionButton
              label="Cobrar"
              variant="primary"
              onClick={() => {
                void post("charge", { subscriptionId: s.id });
                setMessage(`Cobrança registrada para ${s.workshopName}. Dono verá aviso no painel.`);
              }}
            />
            <ActionButton
              label="WhatsApp"
              onClick={() => {
                const text = subscriptionMessage(
                  s.monthlyValue,
                  s.paymentLink ? `— pagamento: ${s.paymentLink}` : "está pendente."
                );
                shareViaWhatsApp(text);
              }}
            />
            {!s.paid ? (
              <ActionButton label="Marcar pago" variant="success" onClick={() => void post("set-paid", { subscriptionId: s.id, paid: true })} />
            ) : (
              <ActionButton label="Pendente" onClick={() => void post("set-paid", { subscriptionId: s.id, paid: false })} />
            )}
            {s.status !== "suspensa" ? (
              <ActionButton label="Suspender" variant="danger" onClick={() => void post("set-status", { subscriptionId: s.id, status: "suspensa" })} />
            ) : (
              <ActionButton label="Reativar" variant="success" onClick={() => void post("set-status", { subscriptionId: s.id, status: "ativa" })} />
            )}
          </div>,
        ])}
      />

      <p className="mt-6 text-sm text-muted">
        Para alterar valor ou data de cobrança, edite a assinatura abaixo (oficinas são sincronizadas automaticamente).
      </p>

      <div className="mt-4 space-y-3">
        {items.map((s) => (
          <SubscriptionEditRow key={s.id} sub={s} onSave={async (data) => {
            await post("upsert", { workshopId: s.workshopId, ...data });
            setMessage("Assinatura atualizada.");
          }} />
        ))}
      </div>
    </PermissionGuard>
  );
}

function SubscriptionEditRow({
  sub,
  onSave,
}: {
  sub: SubscriptionRow;
  onSave: (data: { monthlyValue: number; nextDueAt: string; paymentLink?: string }) => Promise<void>;
}) {
  const [value, setValue] = useState(String(sub.monthlyValue));
  const [due, setDue] = useState(sub.nextDueAt.slice(0, 10));
  const [link, setLink] = useState(sub.paymentLink ?? "");

  return (
    <div className="card grid gap-2 p-4 sm:grid-cols-5">
      <p className="font-medium sm:col-span-5">{sub.workshopName}</p>
      <input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} className="input-field" placeholder="Valor/mês" />
      <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="input-field" />
      <input value={link} onChange={(e) => setLink(e.target.value)} className="input-field sm:col-span-2" placeholder="Link de pagamento" />
      <ActionButton
        label="Salvar"
        variant="primary"
        onClick={() =>
          void onSave({
            monthlyValue: Number(value),
            nextDueAt: new Date(due).toISOString(),
            paymentLink: link,
          })
        }
      />
    </div>
  );
}
