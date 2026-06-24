"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/dashboard/DashboardUI";
import { fetchAdminUsers, fetchAdminWorkshops } from "@/lib/api/admin-client";
import { roleLabels } from "@/lib/permissions";

export function AdminHome() {
  const [workshopCount, setWorkshopCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [workshopNames, setWorkshopNames] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const [w, u] = await Promise.all([fetchAdminWorkshops(), fetchAdminUsers()]);
      setWorkshopCount(w.workshops.length);
      setWorkshopNames(w.workshops.map((x) => x.name));
      setUserCount(u.users.filter((x) => x.role !== "master").length);
    }
    void load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard geral"
        description="Visão global da plataforma — cadastre oficinas e libere acessos"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Oficinas ativas" value={workshopCount} icon="building" />
        <StatCard label="Contas operacionais" value={userCount} icon="users" />
        <StatCard label="Próximo passo" value="→" icon="clipboard" trend="Cadastrar oficina" />
        <StatCard label="Acessos" value="→" icon="credit-card" trend="Criar gerência/mecânico" />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Oficinas na plataforma</h2>
            <Link href="/dashboard/admin/oficinas" className="dash-link text-sm font-medium">
              Gerenciar
            </Link>
          </div>
          {workshopNames.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma oficina ainda. Cadastre a primeira em Oficinas.</p>
          ) : (
            <ul className="divide-y divide-border">
              {workshopNames.map((name) => (
                <li key={name} className="py-3 text-sm font-medium text-foreground">
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Fluxo recomendado</h2>
            <Link href="/dashboard/admin/contas" className="dash-link text-sm font-medium">
              Contas
            </Link>
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>Cadastre a oficina (com ou sem dono)</li>
            <li>Crie contas de {roleLabels.gerencia} e {roleLabels.mecanico}</li>
            <li>Valide login, cadastros, orçamentos e agenda</li>
            <li>Confira o perfil público em /oficinas/slug</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
