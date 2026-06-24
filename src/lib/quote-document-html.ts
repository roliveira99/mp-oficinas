import type {
  CustomerQuotePayload,
  DocumentIssuer,
  QuoteTemplateSettings,
} from "@/types/quote-document";
import { formatCnpj, formatMoney, lineItemTotal, quoteTotal } from "@/types/quote-document";
import { exportDocumentPngFromHtml, openDocumentPrintWindow } from "@/lib/document-export";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatIssuedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const DOCUMENT_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Segoe UI", system-ui, -apple-system, sans-serif; color: #0f172a; background: #f1f5f9; }
  .doc { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 30px rgba(15,23,42,0.08); }
  .doc-bar { height: 6px; background: linear-gradient(90deg, #1d4ed8, #3b82f6); }
  .doc-body { padding: 32px 36px 28px; }
  .doc-type { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; }
  .doc-title { font-size: 26px; font-weight: 800; color: #0f172a; margin-top: 4px; line-height: 1.2; }
  .doc-legal { font-size: 13px; color: #475569; margin-top: 4px; }
  .doc-issuer { border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 16px 0; margin: 20px 0; font-size: 13px; color: #334155; line-height: 1.6; }
  .doc-note { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 14px; font-size: 12px; color: #1e40af; line-height: 1.5; margin-bottom: 20px; border-radius: 0 8px 8px 0; }
  .doc-meta { margin-bottom: 24px; font-size: 13px; color: #334155; line-height: 1.7; }
  .doc-meta strong { color: #0f172a; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
  thead th { text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b; padding: 10px 8px; border-bottom: 2px solid #0f172a; }
  thead th.num { text-align: right; }
  tbody td { padding: 11px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tbody td.num { text-align: right; font-variant-numeric: tabular-nums; }
  tfoot td { padding: 14px 8px 0; font-weight: 800; font-size: 18px; }
  tfoot td.num { text-align: right; }
  .doc-footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6; }
  @media print {
    body { background: #fff; }
    .doc { border: none; box-shadow: none; border-radius: 0; max-width: none; }
    .doc-body { padding: 0; }
  }
`;

export function buildCustomerQuoteDocumentHtml(
  payload: CustomerQuotePayload,
  issuer: DocumentIssuer,
  template: QuoteTemplateSettings
): string {
  const validUntil = new Date(payload.issuedAt);
  validUntil.setDate(validUntil.getDate() + template.validityDays);
  const total = quoteTotal(payload.items);

  const rows = payload.items
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.description)}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${formatMoney(item.unitPrice)}</td>
        <td class="num"><strong>${formatMoney(lineItemTotal(item))}</strong></td>
      </tr>`
    )
    .join("");

  const vehicleLine =
    payload.vehicle || payload.vehiclePlate
      ? `<p><strong>Veículo:</strong> ${escapeHtml(
          [payload.vehicle, payload.vehiclePlate ? `Placa ${payload.vehiclePlate}` : ""]
            .filter(Boolean)
            .join(" · ")
        )}</p>`
      : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(template.documentTitle)} — ${escapeHtml(payload.orderId)}</title>
  <style>${DOCUMENT_STYLES}</style>
</head>
<body>
  <div class="doc">
    <div class="doc-bar"></div>
    <div class="doc-body">
      <div class="doc-type">${escapeHtml(template.documentTitle)}</div>
      <div class="doc-title">${escapeHtml(issuer.tradeName)}</div>
      <div class="doc-legal">${escapeHtml(issuer.legalName)}</div>

      <div class="doc-issuer">
        <div><strong>CNPJ:</strong> ${formatCnpj(issuer.cnpj)}</div>
        <div>${escapeHtml(issuer.address)} — ${escapeHtml(issuer.city)}/${escapeHtml(issuer.state)}</div>
        <div>${escapeHtml(issuer.phone)}${issuer.email ? ` · ${escapeHtml(issuer.email)}` : ""}</div>
      </div>

      ${template.headerNote ? `<div class="doc-note">${escapeHtml(template.headerNote)}</div>` : ""}

      <div class="doc-meta">
        <p><strong>Cliente:</strong> ${escapeHtml(payload.clientName)}</p>
        ${payload.clientCpf ? `<p><strong>CPF:</strong> ${escapeHtml(payload.clientCpf)}</p>` : ""}
        ${vehicleLine}
        <p><strong>Referência:</strong> ${escapeHtml(payload.orderId)}</p>
        <p><strong>Data:</strong> ${formatIssuedDate(payload.issuedAt)}</p>
        <p><strong>Validade:</strong> ${validUntil.toLocaleDateString("pt-BR")} (${template.validityDays} dias)</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Serviço / peça</th>
            <th class="num">Qtd</th>
            <th class="num">Unit.</th>
            <th class="num">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="3">Total</td>
            <td class="num">${formatMoney(total)}</td>
          </tr>
        </tfoot>
      </table>

      <div class="doc-footer">
        <p><strong>Formas de pagamento:</strong> ${escapeHtml(template.paymentTerms)}</p>
        ${template.footerNote ? `<p style="margin-top:8px">${escapeHtml(template.footerNote)}</p>` : ""}
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function openCustomerQuotePrintWindow(
  payload: CustomerQuotePayload,
  issuer: DocumentIssuer,
  template: QuoteTemplateSettings
): void {
  openDocumentPrintWindow(buildCustomerQuoteDocumentHtml(payload, issuer, template));
}

export async function exportCustomerQuotePng(
  payload: CustomerQuotePayload,
  issuer: DocumentIssuer,
  template: QuoteTemplateSettings
): Promise<Blob> {
  return exportDocumentPngFromHtml(buildCustomerQuoteDocumentHtml(payload, issuer, template));
}
