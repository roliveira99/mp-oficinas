"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ActionButton, DataTable } from "@/components/dashboard/DashboardUI";
import { PageHeader } from "@/components/dashboard/DashboardUI";
import { PermissionGuard } from "@/components/dashboard/PermissionGuard";
import {
  QuoteDocumentActions,
  QuoteLineItemsEditor,
} from "@/components/quotes/CustomerQuoteDocument";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatCpf } from "@/lib/cpf";
import {
  getDefaultIssuer,
  getDocumentIssuers,
  getQuoteTemplate,
  orderToDefaultLineItems,
} from "@/lib/quote-document-storage";
import { fetchCrm } from "@/lib/api/crm-client";
import type { WorkshopClient, WorkshopServiceOrder } from "@/types/client";
import type { CustomerQuotePayload, QuoteLineItem } from "@/types/quote-document";
import { formatCnpj } from "@/types/quote-document";

export default function NotasClientePage() {
  const { user } = useAuth();
  const workshopId = user?.workshopId ?? "1";
  const isOwner = user?.role === "dono";
  const [orders, setOrders] = useState<WorkshopServiceOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<WorkshopServiceOrder | null>(null);
  const [issuerId, setIssuerId] = useState("");
  const [items, setItems] = useState<QuoteLineItem[]>([]);
  const [preview, setPreview] = useState(false);

  const issuers = getDocumentIssuers(workshopId);
  const template = getQuoteTemplate(workshopId);
  const [clients, setClients] = useState<WorkshopClient[]>([]);

  const refresh = useCallback(async () => {
    const data = await fetchCrm();
    setOrders(data.orders);
    setClients(data.clients);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, user?.workshopId]);

  useEffect(() => {
    const def = getDefaultIssuer(workshopId);
    if (def && !issuerId) setIssuerId(def.id);
  }, [workshopId, issuerId]);

  function openNote(order: WorkshopServiceOrder) {
    setActiveOrder(order);
    setItems(orderToDefaultLineItems(order.service, order.value));
    setPreview(false);
    const def = getDefaultIssuer(workshopId);
    setIssuerId(def?.id ?? issuers[0]?.id ?? "");
  }

  const issuer = issuers.find((i) => i.id === issuerId);
  const client = activeOrder
    ? clients.find((c) => c.id === activeOrder.clientId)
    : null;

  const payload: CustomerQuotePayload | null =
    activeOrder && issuer
      ? {
          orderId: activeOrder.id,
          issuerId: issuer.id,
          clientName: activeOrder.clientName,
          clientPhone: client?.phone ?? "",
          clientCpf: client ? formatCpf(client.cpf) : undefined,
          vehicle: activeOrder.vehicle,
          vehiclePlate: activeOrder.vehiclePlate,
          items,
          issuedAt: new Date().toISOString(),
        }
      : null;

  return (
    <PermissionGuard
      permissions={["owner.emissao_pdf", "owner.envio_whatsapp", "gerencia.emissao_notas", "gerencia.emissao_pdf", "gerencia.envio_whatsapp"]}
    >
      <PageHeader
        title="Notas ao cliente"
        description="Documento profissional com CNPJ e serviços — imprimir, enviar imagem por WhatsApp ou e-mail"
        actions={
          isOwner ? (
            <Link
              href="/dashboard/notas/emitentes"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-hover"
            >
              Configurar emitentes
            </Link>
          ) : undefined
        }
      />

      {issuers.length === 0 ? (
        <p className="card p-6 text-sm text-muted">
          Nenhum emitente (CNPJ) cadastrado.{" "}
          {isOwner ? (
            <Link href="/dashboard/notas/emitentes" className="dash-link font-medium">
              Cadastre nomes e CNPJs
            </Link>
          ) : (
            "Peça ao dono da oficina para configurar os emitentes."
          )}
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">
            Orçamentos internos continuam em{" "}
            <Link href="/dashboard/orcamentos" className="dash-link">
              Orçamentos
            </Link>
            . Aqui você gera a <strong>nota para o cliente</strong> com layout padrão.
          </p>

          <DataTable
            headers={["OS", "Cliente", "Serviço", "Valor", "Ações"]}
            rows={orders.map((o) => [
              o.id,
              o.clientName,
              o.service,
              `R$ ${o.value.toFixed(2)}`,
              <ActionButton key={o.id} label="Emitir nota" variant="primary" onClick={() => openNote(o)} />,
            ])}
          />
        </>
      )}

      {activeOrder && issuer && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12">
          <div className="card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6">
            <h2 className="text-lg font-semibold">Nota — {activeOrder.id}</h2>
            <p className="mt-1 text-sm text-muted">Cliente: {activeOrder.clientName}</p>

            {!preview ? (
              <div className="mt-6 space-y-5">
                <label className="block text-sm">
                  <span className="font-medium">Emitente (CNPJ / razão social)</span>
                  <select
                    value={issuerId}
                    onChange={(e) => setIssuerId(e.target.value)}
                    className="input-field mt-1.5"
                  >
                    {issuers.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.label} — {formatCnpj(i.cnpj)}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <p className="mb-2 text-sm font-medium">Serviços e peças</p>
                  <QuoteLineItemsEditor items={items} onChange={setItems} />
                </div>

                {!client?.phone && (
                  <p className="text-sm text-muted">
                    Cliente sem telefone no cadastro — WhatsApp usará o número do emitente. Atualize em Cadastros.
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPreview(true)}
                    className="btn btn-primary"
                  >
                    Visualizar nota
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveOrder(null)}
                    className="rounded-lg border border-border px-4 py-2 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              payload && (
                <div className="mt-6">
                  <QuoteDocumentActions
                    payload={payload}
                    issuer={issuer}
                    template={template}
                    clientPhone={client?.phone}
                    onClose={() => {
                      setPreview(false);
                      setActiveOrder(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setPreview(false)}
                    className="dash-link mt-4 text-sm"
                  >
                    Voltar e editar
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </PermissionGuard>
  );
}
