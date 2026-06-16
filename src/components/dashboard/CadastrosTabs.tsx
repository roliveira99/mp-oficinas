"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionButton, DataTable } from "@/components/dashboard/DashboardUI";
import { formatCpf } from "@/lib/cpf";
import { apiAddVehicle, fetchCrm } from "@/lib/api/crm-client";
import type { WorkshopClient, WorkshopVehicle } from "@/types/client";

export function ClientesTab({ workshopId }: { workshopId: string }) {
  const [clients, setClients] = useState<WorkshopClient[]>([]);
  const [vehicles, setVehicles] = useState<WorkshopVehicle[]>([]);

  const refresh = useCallback(async () => {
    const data = await fetchCrm();
    setClients(data.clients);
    setVehicles(data.vehicles);
  }, [workshopId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Clientes aparecem aqui automaticamente quando se cadastram para avaliar no perfil público
        (CPF + placa do veículo). Não é necessário cadastrar cliente na operação do dia a dia.
      </p>

      {clients.length === 0 ? (
        <p className="text-sm text-muted">Nenhum cliente registrado via avaliação ainda.</p>
      ) : (
        <DataTable
          headers={["Nome", "CPF", "Telefone", "Veículos", "Pode avaliar", "Ações"]}
          rows={clients.map((c) => [
            c.name,
            formatCpf(c.cpf),
            c.phone || "—",
            vehicles.filter((v) => v.clientId === c.id).length,
            c.completedServices.length > 0 ? (
              <span key={`rev-${c.id}`} className="dash-badge">
                Sim ({c.completedServices.length} serviço{c.completedServices.length > 1 ? "s" : ""})
              </span>
            ) : (
              <span key={`wait-${c.id}`} className="text-xs text-muted">
                Aguardando serviço concluído
              </span>
            ),
            <ActionButton key={`edit-${c.id}`} label="Editar" />,
          ])}
        />
      )}
    </div>
  );
}

export function VeiculosTab({ workshopId }: { workshopId: string }) {
  const [vehicles, setVehicles] = useState<WorkshopVehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const data = await fetchCrm();
    setVehicles(data.vehicles);
  }, [workshopId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = await apiAddVehicle({ plate, model });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPlate("");
    setModel("");
    setShowForm(false);
    await refresh();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Cadastre apenas placa e modelo. O cliente só se identifica depois, ao avaliar no site público.
        </p>
        <ActionButton
          label={showForm ? "Cancelar" : "+ Novo veículo"}
          variant={showForm ? "secondary" : "primary"}
          onClick={() => {
            setShowForm(!showForm);
            setError("");
          }}
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-4 p-5">
          <h3 className="font-semibold">Cadastrar veículo</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              className="input-field"
              placeholder="Placa *"
            />
            <input
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="input-field"
              placeholder="Modelo / ano *"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" className="btn btn-primary">
            Salvar veículo
          </button>
        </form>
      )}

      {vehicles.length === 0 ? (
        <p className="text-sm text-muted">Nenhum veículo cadastrado. Comece pela placa do carro ou moto.</p>
      ) : (
        <DataTable
          headers={["Placa", "Modelo", "Serviços p/ avaliar", "Cliente vinculado", "Ações"]}
          rows={vehicles.map((v) => [
            v.plate,
            v.model,
            (v.completedServices?.length ?? 0) > 0 ? (
              <span key={`pend-${v.id}`} className="dash-badge">
                {v.completedServices!.length} aguardando avaliação
              </span>
            ) : (
              <span key={`none-${v.id}`} className="text-xs text-muted">—</span>
            ),
            v.clientId ? "Identificado na avaliação" : "Não identificado",
            <ActionButton key={v.id} label="Editar" />,
          ])}
        />
      )}
    </div>
  );
}
