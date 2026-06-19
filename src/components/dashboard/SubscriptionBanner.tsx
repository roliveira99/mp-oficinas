"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ActionButton } from "@/components/dashboard/DashboardUI";
import { subscriptionMessage } from "@/lib/brand";
import { shareViaWhatsApp } from "@/lib/document-share";

interface SubscriptionInfo {
  monthlyValue: number;
  nextDueAt: string;
  status: string;
  paid: boolean;
  paymentLink: string | null;
  lastChargedAt: string | null;
  daysSinceCharge: number | null;
}

export function SubscriptionBanner() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    void fetch("/api/admin/subscriptions")
      .then((r) => r.json())
      .then((data: { subscription: SubscriptionInfo | null }) => setSub(data.subscription))
      .catch(() => {});
  }, []);

  if (!sub) return null;
  const overdue = !sub.paid && (sub.status === "atrasada" || new Date(sub.nextDueAt) < new Date());
  const showReminder = overdue || sub.lastChargedAt;

  if (!showReminder && sub.paid) return null;

  const text = `${subscriptionMessage(sub.monthlyValue, sub.paymentLink ? `Pague em: ${sub.paymentLink}` : "Entre em contato para regularizar.")}`;

  return (
    <div className={`mb-6 rounded-xl border p-4 ${overdue ? "border-danger/50 bg-danger/10" : "border-accent/40 bg-accent-soft"}`}>
      <p className="font-semibold text-foreground">
        {overdue ? "Cobrança pendente" : "Lembrete de assinatura"}
      </p>
      <p className="mt-1 text-sm text-muted">
        Valor: R$ {sub.monthlyValue.toFixed(2)} — Vencimento: {new Date(sub.nextDueAt).toLocaleDateString("pt-BR")}
        {sub.daysSinceCharge != null && sub.daysSinceCharge > 0 && ` — Cobrado há ${sub.daysSinceCharge} dia(s)`}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {sub.paymentLink && (
          <Link href={sub.paymentLink} target="_blank" className="btn btn-primary text-sm">
            Pagar assinatura
          </Link>
        )}
        <ActionButton label="WhatsApp" onClick={() => shareViaWhatsApp(text)} />
      </div>
    </div>
  );
}
