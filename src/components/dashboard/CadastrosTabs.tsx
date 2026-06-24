"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionButton, DataTable } from "@/components/dashboard/DashboardUI";
import { formatCpf } from "@/lib/cpf";
import { apiAddAsset, apiAddVehicle, fetchCrm } from "@/lib/api/crm-client";
import type { OperationalConfig } from "@/lib/verticals/operational";
import type { WorkshopClient, WorkshopVehicle } from "@/types/client";

export function ClientesTab({ workshopId }: { workshopId: string }) {
  const [clients, setClients] = useState<WorkshopClient[]>([]);

  const refresh = useCallback(async () => {
    const data = await fetchCrm();
    setClients(data.clients);
  }, [workshopId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Perfil do cliente serve para avaliar o negócio e agendar horário — não fica vinculado aos ativos
        operacionais. Clientes aparecem aqui quando se cadastram na avaliação (CPF, nome e data de nascimento).
      </p>

      {clients.length === 0 ? (
        <p className="text-sm text-muted">Nenhum cliente registrado via avaliação ainda.</p>
      ) : (
        <DataTable
          headers={["Nome", "CPF", "Telefone", "Avaliou no app", "Serviços concluídos"]}
          rows={clients.map((c) => [
            c.name,
            formatCpf(c.cpf),
            c.phone || "—",
            c.completedServices.length > 0 ? (
              <span key={`rev-${c.id}`} className="dash-badge">Sim</span>
            ) : (
              <span key={`wait-${c.id}`} className="text-xs text-muted">Aguardando serviço</span>
            ),
            c.completedServices.length,
          ])}
        />
      )}
    </div>
  );
}

export function AtivosTab({
  workshopId,
  config,
}: {
  workshopId: string;
  config: OperationalConfig;
}) {
  const [assets, setAssets] = useState<WorkshopVehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const data = await fetchCrm();
    setAssets(data.vehicles);
  }, [workshopId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const referenceKey = fields.referenceKey?.trim() ?? "";
    const label = fields.label?.trim() ?? "";
    const year = fields.year?.trim();

    if (!referenceKey || !label) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    const result =
      config.assets.type === "vehicle"
        ? await apiAddVehicle({ plate: referenceKey, model: label, year: year || undefined })
        : await apiAddAsset({
            referenceKey,
            label,
            year: year || undefined,
            assetType: config.assets.type,
          });

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setFields({});
    setShowForm(false);
    await refresh();
  }

  const tableHeaders = config.assets.fields
    .filter((f) => f.key === "referenceKey" || f.key === "label" || f.key === "year")
    .map((f) => f.label)
    .concat(["Histórico (serviços)"]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Cadastre {config.assets.pluralLabel.toLowerCase()} para vincular a orçamentos e histórico.
        </p>
        <ActionButton
          label={showForm ? "Cancelar" : `+ Novo ${config.assets.singularLabel.toLowerCase()}`}
          variant={showForm ? "secondary" : "primary"}
          onClick={() => {
            setShowForm(!showForm);
            setError("");
          }}
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-4 p-5">
          <h3 className="font-semibold">Cadastrar {config.assets.singularLabel.toLowerCase()}</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {config.assets.fields.map((field) => (
              <input
                key={field.key}
                required={field.required}
                value={fields[field.key] ?? ""}
                onChange={(e) =>
                  setFields((prev) => ({
                    ...prev,
                    [field.key]: field.key === "referenceKey" ? e.target.value.toUpperCase() : e.target.value,
                  }))
                }
                className="input-field"
                placeholder={`${field.label}${field.required ? " *" : ""}`}
              />
            ))}
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" className="btn btn-primary">
            Salvar
          </button>
        </form>
      )}

      {assets.length === 0 ? (
        <p className="text-sm text-muted">Nenhum {config.assets.singularLabel.toLowerCase()} cadastrado.</p>
      ) : (
        <DataTable
          headers={tableHeaders}
          rows={assets.map((v) => {
            const cells: (string | React.ReactNode)[] = [];
            for (const field of config.assets.fields) {
              if (field.key === "referenceKey") cells.push(v.referenceKey || v.plate);
              else if (field.key === "label") cells.push(v.label || v.model);
              else if (field.key === "year") cells.push(v.year ?? "—");
              else if (field.key === "model") cells.push(v.model);
            }
            cells.push(
              (v.completedServices?.length ?? 0) > 0 ? (
                <span key={`hist-${v.id}`} className="dash-badge">
                  {v.completedServices!.length} serviço{v.completedServices!.length > 1 ? "s" : ""}
                </span>
              ) : (
                <span key={`none-${v.id}`} className="text-xs text-muted">Sem histórico ainda</span>
              )
            );
            return cells;
          })}
        />
      )}
    </div>
  );
}

/** @deprecated Use AtivosTab */
export const VeiculosTab = AtivosTab;
