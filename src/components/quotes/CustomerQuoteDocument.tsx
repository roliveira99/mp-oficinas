"use client";

import { useState } from "react";
import type {
  CustomerQuotePayload,
  DocumentIssuer,
  QuoteLineItem,
  QuoteTemplateSettings,
} from "@/types/quote-document";
import {
  formatCnpj,
  formatMoney,
  lineItemTotal,
  quoteTotal,
} from "@/types/quote-document";
import { shareViaEmail } from "@/lib/document-share";
import {
  buildWhatsAppImageIntro,
  downloadDocumentBlob,
  shareDocumentImageViaWhatsApp,
} from "@/lib/document-whatsapp";
import {
  buildCustomerQuoteDocumentHtml,
  exportCustomerQuotePng,
  openCustomerQuotePrintWindow,
} from "@/lib/quote-document-html";

function formatIssuedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

interface CustomerQuotePrintViewProps {
  payload: CustomerQuotePayload;
  issuer: DocumentIssuer;
  template: QuoteTemplateSettings;
}

export function CustomerQuotePrintView({ payload, issuer, template }: CustomerQuotePrintViewProps) {
  const validUntil = new Date(payload.issuedAt);
  validUntil.setDate(validUntil.getDate() + template.validityDays);
  const total = quoteTotal(payload.items);

  return (
    <div className="mx-auto max-w-[720px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
      <div className="h-1.5 bg-gradient-to-r from-blue-700 to-blue-500" />
      <div className="p-8 text-sm text-slate-900">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          {template.documentTitle}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold leading-tight">{issuer.tradeName}</h1>
        <p className="mt-1 text-slate-600">{issuer.legalName}</p>

        <div className="my-5 border-y border-slate-200 py-4 leading-relaxed text-slate-700">
          <p>
            <strong className="text-slate-900">CNPJ:</strong> {formatCnpj(issuer.cnpj)}
          </p>
          <p>
            {issuer.address} — {issuer.city}/{issuer.state}
          </p>
          <p>
            {issuer.phone}
            {issuer.email ? ` · ${issuer.email}` : ""}
          </p>
        </div>

        {template.headerNote && (
          <p className="mb-5 rounded-r-lg border-l-4 border-blue-500 bg-blue-50 px-3.5 py-3 text-xs leading-relaxed text-blue-900">
            {template.headerNote}
          </p>
        )}

        <div className="mb-6 space-y-1 text-slate-800">
          <p>
            <strong>Cliente:</strong> {payload.clientName}
          </p>
          {payload.clientCpf && (
            <p>
              <strong>CPF:</strong> {payload.clientCpf}
            </p>
          )}
          {(payload.vehicle || payload.vehiclePlate) && (
            <p>
              <strong>Veículo:</strong>{" "}
              {[payload.vehicle, payload.vehiclePlate ? `Placa ${payload.vehiclePlate}` : ""]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          <p>
            <strong>Referência:</strong> {payload.orderId}
          </p>
          <p>
            <strong>Data:</strong> {formatIssuedDate(payload.issuedAt)}
          </p>
          <p>
            <strong>Validade:</strong> {validUntil.toLocaleDateString("pt-BR")} ({template.validityDays}{" "}
            dias)
          </p>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-2.5 pr-2 text-left">Serviço / peça</th>
              <th className="px-2 py-2.5 text-right">Qtd</th>
              <th className="px-2 py-2.5 text-right">Unit.</th>
              <th className="py-2.5 pl-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {payload.items.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="py-3 pr-2">{item.description}</td>
                <td className="px-2 py-3 text-right tabular-nums">{item.quantity}</td>
                <td className="px-2 py-3 text-right tabular-nums">{formatMoney(item.unitPrice)}</td>
                <td className="py-3 pl-2 text-right font-semibold tabular-nums">
                  {formatMoney(lineItemTotal(item))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="pt-4 text-right text-base font-extrabold">
                Total
              </td>
              <td className="pt-4 pl-2 text-right text-lg font-extrabold">{formatMoney(total)}</td>
            </tr>
          </tfoot>
        </table>

        <footer className="mt-6 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-600">
          <p>
            <strong>Formas de pagamento:</strong> {template.paymentTerms}
          </p>
          {template.footerNote && <p className="mt-2">{template.footerNote}</p>}
        </footer>
      </div>
    </div>
  );
}

interface QuoteDocumentActionsProps {
  payload: CustomerQuotePayload;
  issuer: DocumentIssuer;
  template: QuoteTemplateSettings;
  clientPhone?: string;
  onClose?: () => void;
}

export function QuoteDocumentActions({
  payload,
  issuer,
  template,
  clientPhone,
  onClose,
}: QuoteDocumentActionsProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const filename = `documento-${payload.orderId.replace(/[^\w-]/g, "_")}.png`;

  async function handleDownloadImage() {
    setBusy("image");
    setStatus("");
    try {
      const blob = await exportCustomerQuotePng(payload, issuer, template);
      downloadDocumentBlob(blob, filename);
      setStatus("Imagem salva. Use-a no WhatsApp ou e-mail.");
    } catch {
      setStatus("Não foi possível gerar a imagem. Use Imprimir / PDF.");
    } finally {
      setBusy(null);
    }
  }

  function handlePrint() {
    openCustomerQuotePrintWindow(payload, issuer, template);
  }

  function handleOpenPreview() {
    const html = buildCustomerQuoteDocumentHtml(payload, issuer, template);
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }

  async function handleWhatsApp() {
    setBusy("whatsapp");
    setStatus("");
    try {
      const blob = await exportCustomerQuotePng(payload, issuer, template);
      const mode = await shareDocumentImageViaWhatsApp({
        blob,
        filename,
        documentTitle: template.documentTitle,
        tradeName: issuer.tradeName,
        reference: payload.orderId,
        phone: clientPhone || issuer.phone,
      });
      setStatus(
        mode === "shared"
          ? "Documento compartilhado como imagem."
          : `Imagem salva (${filename}). Anexe-a na conversa do WhatsApp.`
      );
    } catch {
      setStatus("Erro ao gerar imagem. Use Baixar imagem ou Imprimir / PDF.");
    } finally {
      setBusy(null);
    }
  }

  function handleEmail() {
    const intro = buildWhatsAppImageIntro(template.documentTitle, issuer.tradeName, payload.orderId);
    shareViaEmail(
      `${template.documentTitle} — ${issuer.tradeName}`,
      `${intro}\n\nPara anexar o documento, use "Baixar imagem" ou "Imprimir / PDF" e salve como PDF.`
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        <button type="button" onClick={handlePrint} className="btn btn-primary">
          Imprimir / PDF
        </button>
        <button
          type="button"
          onClick={() => void handleDownloadImage()}
          disabled={busy === "image"}
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-surface-hover disabled:opacity-60"
        >
          {busy === "image" ? "Gerando…" : "Baixar imagem"}
        </button>
        <button
          type="button"
          onClick={() => void handleWhatsApp()}
          disabled={busy === "whatsapp"}
          className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy === "whatsapp" ? "Preparando…" : "Enviar WhatsApp"}
        </button>
        <button
          type="button"
          onClick={handleEmail}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-hover"
        >
          E-mail
        </button>
        <button
          type="button"
          onClick={handleOpenPreview}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-hover"
        >
          Abrir em nova aba
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-hover"
          >
            Fechar
          </button>
        )}
      </div>

      {status && <p className="mb-4 text-sm text-muted">{status}</p>}

      <div className="bg-slate-100 p-4 print:bg-white print:p-0">
        <CustomerQuotePrintView payload={payload} issuer={issuer} template={template} />
      </div>
    </div>
  );
}

export function QuoteLineItemsEditor({
  items,
  onChange,
}: {
  items: QuoteLineItem[];
  onChange: (items: QuoteLineItem[]) => void;
}) {
  function update(index: number, patch: Partial<QuoteLineItem>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addLine() {
    onChange([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-12">
          <input
            required
            value={item.description}
            onChange={(e) => update(index, { description: e.target.value })}
            className="input-field sm:col-span-6"
            placeholder="Descrição do serviço ou peça"
          />
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => update(index, { quantity: Number(e.target.value) })}
            className="input-field sm:col-span-2"
            placeholder="Qtd"
          />
          <input
            type="number"
            min={0}
            step={0.01}
            value={item.unitPrice}
            onChange={(e) => update(index, { unitPrice: Number(e.target.value) })}
            className="input-field sm:col-span-3"
            placeholder="Valor unit."
          />
          <button
            type="button"
            onClick={() => remove(index)}
            className="text-sm text-red-600 sm:col-span-1"
            disabled={items.length <= 1}
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={addLine} className="text-sm font-medium text-accent">
        + Adicionar linha
      </button>
      <p className="text-sm font-semibold">Total: {formatMoney(quoteTotal(items))}</p>
    </div>
  );
}
