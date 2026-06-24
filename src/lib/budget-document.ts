import type { BudgetRecord } from "@/types/budget";
import type { DocumentLineItem } from "@/types/document-line";
import type { DocumentIssuer, QuoteTemplateSettings } from "@/types/quote-document";
import { formatCnpj, formatMoney } from "@/types/quote-document";
import { exportDocumentPngFromHtml, openDocumentPrintWindow } from "@/lib/document-export";
import { getDefaultIssuer, getQuoteTemplate } from "@/lib/quote-document-storage";
import { resolveServiceNoteIssuer, shortNoteNumber } from "@/lib/service-note-document";

export interface BudgetDocumentPayload {
  budgetId: string;
  displayNumber: string;
  issuedAt: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  lineItems: DocumentLineItem[];
  paymentMethods: string[];
  subtotal: number;
  total: number;
  mechanicName?: string;
  notes?: string | null;
  validityDays: number;
}

export function resolveBudgetIssuer(workshopId: string, workshopName: string): DocumentIssuer {
  return resolveServiceNoteIssuer(workshopId, workshopName);
}

export function getBudgetTemplate(workshopId: string): QuoteTemplateSettings {
  const template = getQuoteTemplate(workshopId);
  return {
    ...template,
    documentTitle: "Orçamento",
    headerNote:
      template.headerNote ||
      "Agradecemos a preferência. Os valores abaixo são estimativas e podem variar após inspeção presencial do veículo.",
  };
}

export function budgetToPayload(budget: BudgetRecord, validityDays: number): BudgetDocumentPayload {
  return {
    budgetId: budget.id,
    displayNumber: shortNoteNumber(budget.id),
    issuedAt: budget.createdAt,
    vehiclePlate: budget.vehiclePlate,
    vehicleModel: budget.vehicleModel,
    vehicleYear: budget.vehicleYear,
    lineItems: budget.lineItems,
    paymentMethods: budget.paymentMethods,
    subtotal: budget.subtotal,
    total: budget.total,
    mechanicName: budget.mechanicName ?? undefined,
    notes: budget.notes,
    validityDays,
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

function validUntilDate(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

const DOCUMENT_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Segoe UI", system-ui, -apple-system, sans-serif; color: #0f172a; background: #f1f5f9; }
  .doc { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 30px rgba(15,23,42,0.08); }
  .doc-bar { height: 6px; background: linear-gradient(90deg, #b45309, #f59e0b); }
  .doc-body { padding: 32px 36px 28px; }
  .doc-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
  .doc-type { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; }
  .doc-title { font-size: 26px; font-weight: 800; color: #0f172a; margin-top: 4px; line-height: 1.2; }
  .doc-legal { font-size: 13px; color: #475569; margin-top: 4px; }
  .doc-badge { text-align: right; flex-shrink: 0; }
  .doc-badge-label { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; }
  .doc-badge-num { font-size: 22px; font-weight: 800; color: #d97706; margin-top: 2px; font-variant-numeric: tabular-nums; }
  .doc-badge-date { font-size: 12px; color: #64748b; margin-top: 4px; }
  .doc-issuer { border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 16px 0; margin-bottom: 20px; font-size: 13px; color: #334155; line-height: 1.6; }
  .doc-note { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 14px; font-size: 12px; color: #92400e; line-height: 1.5; margin-bottom: 20px; border-radius: 0 8px 8px 0; }
  .doc-validity { background: #fef3c7; border: 1px solid #fde68a; padding: 10px 14px; font-size: 12px; color: #78350f; margin-bottom: 20px; border-radius: 8px; }
  .doc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-bottom: 24px; font-size: 13px; }
  .doc-field label { display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8; margin-bottom: 3px; }
  .doc-field span { color: #0f172a; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead th { text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b; padding: 10px 8px; border-bottom: 2px solid #0f172a; }
  thead th.num { text-align: right; }
  tbody td { padding: 11px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tbody td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .kind-tag { display: inline-block; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 6px; border-radius: 4px; margin-right: 6px; }
  .kind-servico { background: #eff6ff; color: #1d4ed8; }
  .kind-peca { background: #f0fdf4; color: #059669; }
  .totals { margin-top: 16px; border-top: 2px solid #0f172a; padding-top: 12px; }
  .totals-row { display: flex; justify-content: space-between; font-size: 13px; color: #475569; padding: 4px 8px; }
  .totals-row.grand { font-size: 18px; font-weight: 800; color: #0f172a; padding-top: 8px; }
  .doc-obs { margin-top: 16px; padding: 12px 14px; background: #f8fafc; border-radius: 8px; font-size: 12px; color: #475569; line-height: 1.5; }
  .doc-footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6; }
  @media print {
    body { background: #fff; }
    .doc { border: none; box-shadow: none; border-radius: 0; max-width: none; }
    .doc-body { padding: 0; }
  }
`;

export function buildBudgetDocumentHtml(
  payload: BudgetDocumentPayload,
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

  const vehicleText = [
    payload.vehicleModel,
    payload.vehicleYear,
    payload.vehiclePlate ? `Placa ${payload.vehiclePlate}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Orçamento ${escapeHtml(payload.displayNumber)} — ${escapeHtml(issuer.tradeName)}</title>
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
          <div class="doc-badge-label">Nº do orçamento</div>
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

      <div class="doc-validity">
        <strong>Validade:</strong> ${validUntilDate(payload.issuedAt, payload.validityDays)}
        (${payload.validityDays} dias a partir da emissão)
      </div>

      <div class="doc-grid">
        <div class="doc-field">
          <label>Veículo</label>
          <span>${escapeHtml(vehicleText || "—")}</span>
        </div>
        <div class="doc-field">
          <label>Mecânico responsável</label>
          <span>${escapeHtml(payload.mechanicName || "—")}</span>
        </div>
        <div class="doc-field">
          <label>Formas de pagamento</label>
          <span>${escapeHtml(formatPaymentMethods(payload.paymentMethods))}</span>
        </div>
        <div class="doc-field">
          <label>Pagamento (termos)</label>
          <span>${escapeHtml(template.paymentTerms)}</span>
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
        <div class="totals-row grand"><span>Total estimado</span><span>${formatMoney(payload.total)}</span></div>
      </div>

      ${payload.notes ? `<div class="doc-obs"><strong>Observações:</strong> ${escapeHtml(payload.notes)}</div>` : ""}

      <div class="doc-footer">
        ${template.footerNote ? `<div>${escapeHtml(template.footerNote)}</div>` : ""}
        <div style="margin-top:8px"><strong>${escapeHtml(issuer.tradeName)}</strong> — Orçamento gerado em ${formatIssuedDate(payload.issuedAt)}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function buildBudgetShareText(
  payload: BudgetDocumentPayload,
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
    payload.vehiclePlate || payload.vehicleModel
      ? `Veículo: ${[payload.vehicleModel, payload.vehicleYear, payload.vehiclePlate ? `Placa ${payload.vehiclePlate}` : ""].filter(Boolean).join(" · ")}`
      : "",
    payload.mechanicName ? `Mecânico: ${payload.mechanicName}` : "",
    `Data: ${formatIssuedDate(payload.issuedAt)}`,
    `Validade: ${validUntilDate(payload.issuedAt, payload.validityDays)} (${payload.validityDays} dias)`,
    "",
    "*Serviços e peças:*",
    ...lines,
    "",
    `*Total estimado: ${formatMoney(payload.total)}*`,
    "",
    `Pagamento: ${formatPaymentMethods(payload.paymentMethods)}`,
    template.paymentTerms,
    payload.notes ? `Obs.: ${payload.notes}` : "",
    template.footerNote,
    issuer.address && issuer.city ? `${issuer.address} — ${issuer.city}/${issuer.state}` : "",
    issuer.phone,
  ]
    .filter(Boolean)
    .join("\n");
}

export function openBudgetPrintWindow(
  payload: BudgetDocumentPayload,
  issuer: DocumentIssuer,
  template: QuoteTemplateSettings
): void {
  openDocumentPrintWindow(buildBudgetDocumentHtml(payload, issuer, template));
}

export async function exportBudgetPng(
  payload: BudgetDocumentPayload,
  issuer: DocumentIssuer,
  template: QuoteTemplateSettings
): Promise<Blob> {
  return exportDocumentPngFromHtml(buildBudgetDocumentHtml(payload, issuer, template));
}
