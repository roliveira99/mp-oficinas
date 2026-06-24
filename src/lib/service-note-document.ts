import type { DocumentLineItem } from "@/types/document-line";
import type { ServiceNoteRecord } from "@/types/service-note";
import type { DocumentIssuer, QuoteTemplateSettings } from "@/types/quote-document";
import { formatCnpj, formatMoney } from "@/types/quote-document";
import { getDefaultIssuer, getQuoteTemplate } from "@/lib/quote-document-storage";
import { exportDocumentPngFromHtml, openDocumentPrintWindow } from "@/lib/document-export";

export interface ServiceNoteDocumentPayload {
  noteId: string;
  displayNumber: string;
  issuedAt: string;
  clientName?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  lineItems: DocumentLineItem[];
  paymentMethods: string[];
  subtotal: number;
  total: number;
  mechanicName?: string;
}

export function shortNoteNumber(noteId: string): string {
  return noteId.slice(-8).toUpperCase();
}

export function resolveServiceNoteIssuer(
  workshopId: string,
  workshopName: string
): DocumentIssuer {
  const issuer = getDefaultIssuer(workshopId);
  if (issuer) return issuer;
  return {
    id: "fallback",
    workshopId,
    label: workshopName,
    tradeName: workshopName,
    legalName: workshopName,
    cnpj: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    isDefault: true,
  };
}

export function getServiceNoteTemplate(workshopId: string): QuoteTemplateSettings {
  const template = getQuoteTemplate(workshopId);
  return {
    ...template,
    documentTitle: "Nota de Serviço",
    headerNote:
      template.headerNote ||
      "Documento de prestação de serviços automotivos. Os valores abaixo referem-se aos serviços e peças efetivamente realizados.",
  };
}

export function serviceNoteToPayload(note: ServiceNoteRecord): ServiceNoteDocumentPayload {
  return {
    noteId: note.id,
    displayNumber: shortNoteNumber(note.id),
    issuedAt: note.issuedAt,
    clientName: note.clientName,
    vehiclePlate: note.vehiclePlate,
    vehicleModel: note.vehicleModel,
    lineItems: note.lineItems,
    paymentMethods: note.paymentMethods,
    subtotal: note.subtotal,
    total: note.total,
    mechanicName: note.mechanicName ?? undefined,
  };
}

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const DOCUMENT_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Segoe UI", system-ui, -apple-system, sans-serif; color: #0f172a; background: #f1f5f9; }
  .doc { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 30px rgba(15,23,42,0.08); }
  .doc-bar { height: 6px; background: linear-gradient(90deg, #1d4ed8, #3b82f6); }
  .doc-body { padding: 32px 36px 28px; }
  .doc-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
  .doc-type { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; }
  .doc-title { font-size: 26px; font-weight: 800; color: #0f172a; margin-top: 4px; line-height: 1.2; }
  .doc-legal { font-size: 13px; color: #475569; margin-top: 4px; }
  .doc-badge { text-align: right; flex-shrink: 0; }
  .doc-badge-label { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; }
  .doc-badge-num { font-size: 22px; font-weight: 800; color: #1d4ed8; margin-top: 2px; font-variant-numeric: tabular-nums; }
  .doc-badge-date { font-size: 12px; color: #64748b; margin-top: 4px; }
  .doc-issuer { border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 16px 0; margin-bottom: 20px; font-size: 13px; color: #334155; line-height: 1.6; }
  .doc-issuer strong { color: #0f172a; }
  .doc-note { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 14px; font-size: 12px; color: #1e40af; line-height: 1.5; margin-bottom: 20px; border-radius: 0 8px 8px 0; }
  .doc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-bottom: 24px; font-size: 13px; }
  .doc-field label { display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8; margin-bottom: 3px; }
  .doc-field span { color: #0f172a; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead th { text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b; padding: 10px 8px; border-bottom: 2px solid #0f172a; }
  thead th.num { text-align: right; }
  tbody td { padding: 11px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tbody td.num { text-align: right; font-variant-numeric: tabular-nums; }
  tbody tr:last-child td { border-bottom: none; }
  .kind-tag { display: inline-block; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 6px; border-radius: 4px; margin-right: 6px; }
  .kind-servico { background: #eff6ff; color: #1d4ed8; }
  .kind-peca { background: #f0fdf4; color: #059669; }
  .totals { margin-top: 16px; border-top: 2px solid #0f172a; padding-top: 12px; }
  .totals-row { display: flex; justify-content: space-between; font-size: 13px; color: #475569; padding: 4px 8px; }
  .totals-row.grand { font-size: 18px; font-weight: 800; color: #0f172a; padding-top: 8px; }
  .doc-footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6; }
  .doc-footer strong { color: #334155; }
  @media print {
    body { background: #fff; }
    .doc { border: none; box-shadow: none; border-radius: 0; max-width: none; }
    .doc-body { padding: 0; }
  }
`;

export function buildServiceNoteDocumentHtml(
  payload: ServiceNoteDocumentPayload,
  issuer: DocumentIssuer,
  template: QuoteTemplateSettings
): string {
  const rows = payload.lineItems
    .map((item) => {
      const kindClass = item.kind === "peca" ? "kind-peca" : "kind-servico";
      const kindLabel = item.kind === "peca" ? "Peça" : "Serviço";
      return `<tr>
        <td><span class="kind-tag ${kindClass}">${kindLabel}</span>${escapeHtml(item.name)}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${formatMoney(item.unitPrice)}</td>
        <td class="num"><strong>${formatMoney(item.total)}</strong></td>
      </tr>`;
    })
    .join("");

  const cnpjLine = issuer.cnpj.replace(/\D/g, "").length === 14
    ? `<div><strong>CNPJ:</strong> ${formatCnpj(issuer.cnpj)}</div>`
    : "";

  const addressLine =
    issuer.address && issuer.city
      ? `<div>${escapeHtml(issuer.address)} — ${escapeHtml(issuer.city)}/${escapeHtml(issuer.state)}</div>`
      : "";

  const contactParts = [issuer.phone, issuer.email].filter((v): v is string => Boolean(v));
  const contactLine = contactParts.length
    ? `<div>${contactParts.map(escapeHtml).join(" · ")}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Nota de Serviço ${escapeHtml(payload.displayNumber)} — ${escapeHtml(issuer.tradeName)}</title>
  <style>${DOCUMENT_STYLES}</style>
</head>
<body>
  <div class="doc">
    <div class="doc-bar"></div>
    <div class="doc-body">
      <div class="doc-top">
        <div>
          <div class="doc-type">${escapeHtml(template.documentTitle)}</div>
          <div class="doc-title">${escapeHtml(issuer.tradeName)}</div>
          <div class="doc-legal">${escapeHtml(issuer.legalName)}</div>
        </div>
        <div class="doc-badge">
          <div class="doc-badge-label">Nº da nota</div>
          <div class="doc-badge-num">${escapeHtml(payload.displayNumber)}</div>
          <div class="doc-badge-date">${formatIssuedDate(payload.issuedAt)}</div>
        </div>
      </div>

      <div class="doc-issuer">
        ${cnpjLine}
        ${addressLine}
        ${contactLine}
      </div>

      ${template.headerNote ? `<div class="doc-note">${escapeHtml(template.headerNote)}</div>` : ""}

      <div class="doc-grid">
        <div class="doc-field">
          <label>Cliente</label>
          <span>${escapeHtml(payload.clientName || "—")}</span>
        </div>
        <div class="doc-field">
          <label>Mecânico responsável</label>
          <span>${escapeHtml(payload.mechanicName || "—")}</span>
        </div>
        <div class="doc-field">
          <label>Veículo</label>
          <span>${escapeHtml(
            [payload.vehicleModel, payload.vehiclePlate ? `Placa ${payload.vehiclePlate}` : ""]
              .filter(Boolean)
              .join(" · ") || "—"
          )}</span>
        </div>
        <div class="doc-field">
          <label>Formas de pagamento</label>
          <span>${escapeHtml(formatPaymentMethods(payload.paymentMethods))}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th class="num">Qtd</th>
            <th class="num">Unit.</th>
            <th class="num">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="totals">
        ${
          payload.subtotal !== payload.total
            ? `<div class="totals-row"><span>Subtotal</span><span>${formatMoney(payload.subtotal)}</span></div>`
            : ""
        }
        <div class="totals-row grand"><span>Total</span><span>${formatMoney(payload.total)}</span></div>
      </div>

      <div class="doc-footer">
        ${template.footerNote ? `<div>${escapeHtml(template.footerNote)}</div>` : ""}
        <div style="margin-top:8px"><strong>${escapeHtml(issuer.tradeName)}</strong> — Documento gerado em ${formatIssuedDate(payload.issuedAt)}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function buildServiceNoteShareText(
  payload: ServiceNoteDocumentPayload,
  issuer: DocumentIssuer,
  template: QuoteTemplateSettings
): string {
  const lines = payload.lineItems.map(
    (item, i) =>
      `${i + 1}. ${item.name} — ${item.quantity}x ${formatMoney(item.unitPrice)} = ${formatMoney(item.total)}`
  );

  return [
    `*${template.documentTitle}*`,
    `*${issuer.tradeName}*`,
    issuer.cnpj.replace(/\D/g, "").length === 14 ? `CNPJ: ${formatCnpj(issuer.cnpj)}` : "",
    `Nº ${payload.displayNumber}`,
    "",
    payload.clientName ? `Cliente: ${payload.clientName}` : "",
    payload.vehiclePlate || payload.vehicleModel
      ? `Veículo: ${[payload.vehicleModel, payload.vehiclePlate ? `Placa ${payload.vehiclePlate}` : ""].filter(Boolean).join(" · ")}`
      : "",
    payload.mechanicName ? `Mecânico: ${payload.mechanicName}` : "",
    `Data: ${formatIssuedDate(payload.issuedAt)}`,
    "",
    "*Serviços e peças:*",
    ...lines,
    "",
    `*Total: ${formatMoney(payload.total)}*`,
    "",
    `Pagamento: ${formatPaymentMethods(payload.paymentMethods)}`,
    template.footerNote,
    issuer.address && issuer.city ? `${issuer.address} — ${issuer.city}/${issuer.state}` : "",
    issuer.phone,
  ]
    .filter(Boolean)
    .join("\n");
}

export function openServiceNotePrintWindow(
  payload: ServiceNoteDocumentPayload,
  issuer: DocumentIssuer,
  template: QuoteTemplateSettings
): void {
  openDocumentPrintWindow(buildServiceNoteDocumentHtml(payload, issuer, template));
}

export async function exportServiceNotePng(
  payload: ServiceNoteDocumentPayload,
  issuer: DocumentIssuer,
  template: QuoteTemplateSettings
): Promise<Blob> {
  return exportDocumentPngFromHtml(buildServiceNoteDocumentHtml(payload, issuer, template));
}
