"use client";

import { useState } from "react";
import type { DocumentIssuer, QuoteTemplateSettings } from "@/types/quote-document";
import { formatCnpj, formatMoney } from "@/types/quote-document";
import {
  buildServiceNoteDocumentHtml,
  exportServiceNotePng,
  openServiceNotePrintWindow,
  type ServiceNoteDocumentPayload,
} from "@/lib/service-note-document";
import { shareViaEmail } from "@/lib/document-share";
import {
  downloadDocumentBlob,
  shareDocumentImageViaWhatsApp,
  buildWhatsAppImageIntro,
} from "@/lib/document-whatsapp";

function formatIssuedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatPaymentMethods(methods: string[]): string {
  if (methods.length === 0) return "A combinar";
  return methods.join(" · ");
}

interface ServiceNotePrintViewProps {
  payload: ServiceNoteDocumentPayload;
  issuer: DocumentIssuer;
  template: QuoteTemplateSettings;
}

export function ServiceNotePrintView({ payload, issuer, template }: ServiceNotePrintViewProps) {
  const hasCnpj = issuer.cnpj.replace(/\D/g, "").length === 14;

  return (
    <div className="mx-auto max-w-[720px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
      <div className="h-1.5 bg-gradient-to-r from-blue-700 to-blue-500" />
      <div className="p-8 text-slate-900">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              {template.documentTitle}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight text-slate-900">
              {issuer.tradeName}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{issuer.legalName}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nº da nota</p>
            <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-blue-700">
              {payload.displayNumber}
            </p>
            <p className="mt-1 text-xs text-slate-500">{formatIssuedDate(payload.issuedAt)}</p>
          </div>
        </div>

        <div className="mb-5 border-y border-slate-200 py-4 text-sm leading-relaxed text-slate-700">
          {hasCnpj && <p><strong className="text-slate-900">CNPJ:</strong> {formatCnpj(issuer.cnpj)}</p>}
          {issuer.address && issuer.city && (
            <p>
              {issuer.address} — {issuer.city}/{issuer.state}
            </p>
          )}
          {(issuer.phone || issuer.email) && (
            <p>
              {[issuer.phone, issuer.email].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {template.headerNote && (
          <p className="mb-5 rounded-r-lg border-l-4 border-blue-500 bg-blue-50 px-3.5 py-3 text-xs leading-relaxed text-blue-900">
            {template.headerNote}
          </p>
        )}

        <div className="mb-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cliente</p>
            <p className="font-semibold text-slate-900">{payload.clientName || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Mecânico responsável
            </p>
            <p className="font-semibold text-slate-900">{payload.mechanicName || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Veículo</p>
            <p className="font-semibold text-slate-900">
              {[payload.vehicleModel, payload.vehiclePlate ? `Placa ${payload.vehiclePlate}` : ""]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Formas de pagamento
            </p>
            <p className="font-semibold text-slate-900">
              {formatPaymentMethods(payload.paymentMethods)}
            </p>
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-2.5 pr-2 text-left">Descrição</th>
              <th className="px-2 py-2.5 text-right">Qtd</th>
              <th className="px-2 py-2.5 text-right">Unit.</th>
              <th className="py-2.5 pl-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {payload.lineItems.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="py-3 pr-2">
                  <span
                    className={`mr-1.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                      item.kind === "peca"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {item.kind === "peca" ? "Peça" : "Serviço"}
                  </span>
                  {item.name}
                </td>
                <td className="px-2 py-3 text-right tabular-nums">{item.quantity}</td>
                <td className="px-2 py-3 text-right tabular-nums">{formatMoney(item.unitPrice)}</td>
                <td className="py-3 pl-2 text-right font-semibold tabular-nums">
                  {formatMoney(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 border-t-2 border-slate-900 pt-3">
          {payload.subtotal !== payload.total && (
            <div className="flex justify-between px-2 py-1 text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{formatMoney(payload.subtotal)}</span>
            </div>
          )}
          <div className="flex justify-between px-2 pt-2 text-lg font-extrabold text-slate-900">
            <span>Total</span>
            <span>{formatMoney(payload.total)}</span>
          </div>
        </div>

        <footer className="mt-6 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">
          {template.footerNote && <p>{template.footerNote}</p>}
          <p className="mt-2">
            <strong className="text-slate-700">{issuer.tradeName}</strong> — Documento gerado em{" "}
            {formatIssuedDate(payload.issuedAt)}
          </p>
        </footer>
      </div>
    </div>
  );
}

interface ServiceNoteDocumentActionsProps {
  payload: ServiceNoteDocumentPayload;
  issuer: DocumentIssuer;
  template: QuoteTemplateSettings;
  clientPhone?: string;
  onClose?: () => void;
}

export function ServiceNoteDocumentActions({
  payload,
  issuer,
  template,
  clientPhone,
  onClose,
}: ServiceNoteDocumentActionsProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  function downloadBlob(blob: Blob, filename: string) {
    downloadDocumentBlob(blob, filename);
  }

  async function handleDownloadImage() {
    setBusy("image");
    setStatus("");
    try {
      const blob = await exportServiceNotePng(payload, issuer, template);
      downloadBlob(blob, `nota-servico-${payload.displayNumber}.png`);
      setStatus("Imagem salva no seu computador.");
    } catch {
      setStatus("Não foi possível gerar a imagem. Use Imprimir / PDF.");
    } finally {
      setBusy(null);
    }
  }

  function handlePrint() {
    openServiceNotePrintWindow(payload, issuer, template);
  }

  function handleOpenPreview() {
    const html = buildServiceNoteDocumentHtml(payload, issuer, template);
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }

  async function handleWhatsApp() {
    setBusy("whatsapp");
    setStatus("");
    const filename = `nota-servico-${payload.displayNumber}.png`;

    try {
      const blob = await exportServiceNotePng(payload, issuer, template);
      const mode = await shareDocumentImageViaWhatsApp({
        blob,
        filename,
        documentTitle: template.documentTitle,
        tradeName: issuer.tradeName,
        reference: payload.displayNumber,
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
    setBusy("email");
    const intro = buildWhatsAppImageIntro(
      template.documentTitle,
      issuer.tradeName,
      payload.displayNumber
    );
    shareViaEmail(
      `Nota de Serviço ${payload.displayNumber} — ${issuer.tradeName}`,
      `${intro}\n\nPara anexar o documento, use "Baixar imagem" ou "Imprimir / PDF".`
    );
    setBusy(null);
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
          disabled={busy === "email"}
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
        <ServiceNotePrintView payload={payload} issuer={issuer} template={template} />
      </div>
    </div>
  );
}
