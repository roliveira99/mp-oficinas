"use client";

import Link from "next/link";
import type { DashboardAlert } from "@/types/dashboard-insights";

const severityStyles: Record<DashboardAlert["severity"], string> = {
  info: "border-blue-500/30 bg-blue-500/5 text-foreground",
  warning: "border-amber-500/40 bg-amber-500/10 text-foreground",
  danger: "border-red-500/40 bg-red-500/10 text-foreground",
};

export function DashboardAlertsPanel({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <section className="card mb-8 p-5">
      <h2 className="mb-3 font-semibold text-foreground">Atenção necessária</h2>
      <ul className="space-y-2">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className={`rounded-lg border px-4 py-3 text-sm ${severityStyles[alert.severity]}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{alert.title}</p>
                <p className="mt-0.5 text-muted">{alert.message}</p>
              </div>
              {alert.href && (
                <Link href={alert.href} className="text-xs font-semibold text-accent hover:underline">
                  Ver →
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
