"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { WorkshopReviewsInsight } from "@/types/dashboard-insights";

function stars(n: number) {
  return "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));
}

export function DashboardReviewsPanel({ reviews }: { reviews: WorkshopReviewsInsight }) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-semibold text-foreground">Reputação</h2>
          <p className="text-xs text-muted">Avaliações públicas do seu negócio</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {reviews.count > 0 ? reviews.average.toFixed(1) : "—"}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {reviews.count > 0 ? stars(reviews.average) : "Sem avaliações"}
          </p>
        </div>
      </div>

      <div className="px-5 py-4">
        {reviews.trendLabel && (
          <p className="mb-3 text-xs font-medium text-accent">{reviews.trendLabel}</p>
        )}

        {reviews.recent.length === 0 ? (
          <p className="text-sm text-muted">
            Ainda não há avaliações. Conclua serviços para clientes poderem avaliar no perfil público.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {reviews.recent.map((r) => (
              <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  {stars(r.stars)}
                  <span className="text-muted">{r.clientName}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-foreground">{r.comment || r.serviceLabel}</p>
              </li>
            ))}
          </ul>
        )}

        {reviews.count > 0 && (
          <p className="mt-4 text-xs text-muted">
            {reviews.count} avaliação{reviews.count > 1 ? "ões" : ""} no total. Nota média exibida no diretório.
          </p>
        )}
      </div>

      <div className="border-t border-border px-5 py-3">
        <Link
          href="/dashboard/perfil"
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          Ver perfil público
          <Icon name="arrow-right" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
