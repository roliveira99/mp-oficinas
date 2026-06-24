"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionButton, DataTable } from "@/components/dashboard/DashboardUI";
import { formatClassifiedCategory } from "@/lib/db/classifieds";

interface AdRow {
  id: string;
  title: string;
  body: string;
  price: number | null;
  contact: string | null;
  category: string;
  premium: boolean;
  active: boolean;
  workshopName: string | null;
}

export function ClassifiedPremiumAdminPanel({ onFeedback }: { onFeedback: (msg: string) => void }) {
  const [ads, setAds] = useState<AdRow[]>([]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/classifieds?admin=1");
    if (res.ok) {
      const data = (await res.json()) as { ads: AdRow[] };
      setAds(data.ads);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function togglePremium(ad: AdRow) {
    await fetch("/api/classifieds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id: ad.id, premium: !ad.premium }),
    });
    onFeedback(ad.premium ? "Anúncio removido do jornal premium." : "Anúncio promovido ao jornal premium.");
    await refresh();
  }

  async function toggleActive(ad: AdRow) {
    await fetch("/api/classifieds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id: ad.id, active: !ad.active }),
    });
    onFeedback(ad.active ? "Anúncio desativado." : "Anúncio reativado.");
    await refresh();
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Classificados <strong>premium</strong> aparecem na aba Jornal (home e /curiosidades).
        Negócios publicam anúncios no painel; aqui você escolhe quais vão para o destaque premium.
      </p>

      <DataTable
        headers={["Título", "Negócio", "Categoria", "Preço", "Premium", "Status", "Ações"]}
        rows={ads.map((a) => [
          a.title,
          a.workshopName ?? "—",
          formatClassifiedCategory(a.category),
          a.price != null ? `R$ ${a.price.toFixed(2)}` : "—",
          a.premium ? (
            <span key={`p-${a.id}`} className="dash-badge">No jornal</span>
          ) : (
            "—"
          ),
          a.active ? "Ativo" : "Inativo",
          <div key={a.id} className="flex flex-wrap gap-1">
            <ActionButton
              label={a.premium ? "Remover premium" : "Premium no jornal"}
              variant={a.premium ? "secondary" : "primary"}
              onClick={() => void togglePremium(a)}
            />
            <ActionButton
              label={a.active ? "Desativar" : "Ativar"}
              onClick={() => void toggleActive(a)}
            />
          </div>,
        ])}
      />
    </div>
  );
}
