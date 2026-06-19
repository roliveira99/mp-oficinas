import { migrateStorageKey, storageKey } from "@/lib/brand";
import type {
  CustomerQuotePayload,
  DocumentIssuer,
  QuoteLineItem,
  QuoteTemplateSettings,
} from "@/types/quote-document";
import { formatCnpj, formatMoney, quoteTotal } from "@/types/quote-document";

const KEY = storageKey("notas");

interface QuoteDocumentStore {
  issuers: DocumentIssuer[];
  templates: QuoteTemplateSettings[];
}

const defaultTemplate = (workshopId: string): QuoteTemplateSettings => ({
  workshopId,
  documentTitle: "Orçamento / Nota de serviços",
  headerNote:
    "Agradecemos a preferência. Os valores abaixo são estimativas e podem variar após inspeção presencial do veículo.",
  footerNote: "Garantia conforme normas do fabricante e política interna da oficina.",
  validityDays: 7,
  paymentTerms: "Pix, cartão de crédito/débito e dinheiro.",
});

const seedIssuers = (workshopId: string): DocumentIssuer[] => {
  if (workshopId !== "1") return [];
  return [
    {
      id: "iss-matriz",
      workshopId,
      label: "Matriz — Auto Center Silva",
      tradeName: "Auto Center Silva",
      legalName: "Auto Center Silva Serviços Automotivos Ltda",
      cnpj: "12.345.678/0001-90",
      address: "Rua das Oficinas, 245",
      city: "São Paulo",
      state: "SP",
      phone: "(11) 3456-7890",
      email: "contato@autocentersilva.com.br",
      isDefault: true,
    },
    {
      id: "iss-estetica",
      workshopId,
      label: "Unidade Estética",
      tradeName: "Silva Detailing",
      legalName: "Silva Estética Automotiva ME",
      cnpj: "98.765.432/0001-10",
      address: "Rua das Oficinas, 245 — Galpão B",
      city: "São Paulo",
      state: "SP",
      phone: "(11) 3456-7891",
      email: "estetica@autocentersilva.com.br",
      isDefault: false,
    },
  ];
};

function readStore(): QuoteDocumentStore {
  if (typeof window === "undefined") {
    return { issuers: [], templates: [] };
  }
  migrateStorageKey("notas");
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const initial: QuoteDocumentStore = {
      issuers: seedIssuers("1"),
      templates: [defaultTemplate("1")],
    };
    localStorage.setItem(KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw) as QuoteDocumentStore;
  } catch {
    return { issuers: [], templates: [] };
  }
}

function writeStore(store: QuoteDocumentStore) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

function ensureTemplate(workshopId: string, store: QuoteDocumentStore): QuoteTemplateSettings {
  let t = store.templates.find((x) => x.workshopId === workshopId);
  if (!t) {
    t = defaultTemplate(workshopId);
    store.templates.push(t);
    writeStore(store);
  }
  return t;
}

export function getDocumentIssuers(workshopId: string): DocumentIssuer[] {
  const store = readStore();
  let list = store.issuers.filter((i) => i.workshopId === workshopId);
  if (list.length === 0 && workshopId === "1") {
    store.issuers.push(...seedIssuers(workshopId));
    writeStore(store);
    list = store.issuers.filter((i) => i.workshopId === workshopId);
  }
  return list.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
}

export function getDefaultIssuer(workshopId: string): DocumentIssuer | null {
  const list = getDocumentIssuers(workshopId);
  return list.find((i) => i.isDefault) ?? list[0] ?? null;
}

export function addDocumentIssuer(
  workshopId: string,
  input: Omit<DocumentIssuer, "id" | "workshopId" | "isDefault"> & { isDefault?: boolean }
): DocumentIssuer {
  const store = readStore();
  const isDefault = input.isDefault ?? store.issuers.filter((i) => i.workshopId === workshopId).length === 0;

  if (isDefault) {
    store.issuers = store.issuers.map((i) =>
      i.workshopId === workshopId ? { ...i, isDefault: false } : i
    );
  }

  const issuer: DocumentIssuer = {
    id: `iss-${Date.now()}`,
    workshopId,
    label: input.label.trim(),
    tradeName: input.tradeName.trim(),
    legalName: input.legalName.trim(),
    cnpj: input.cnpj.replace(/\D/g, ""),
    address: input.address.trim(),
    city: input.city.trim(),
    state: input.state.trim().toUpperCase(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    isDefault,
  };

  store.issuers.push(issuer);
  writeStore(store);
  return issuer;
}

export function setDefaultIssuer(workshopId: string, issuerId: string): void {
  const store = readStore();
  store.issuers = store.issuers.map((i) => {
    if (i.workshopId !== workshopId) return i;
    return { ...i, isDefault: i.id === issuerId };
  });
  writeStore(store);
}

export function removeDocumentIssuer(workshopId: string, issuerId: string): void {
  const store = readStore();
  const removed = store.issuers.find((i) => i.id === issuerId);
  store.issuers = store.issuers.filter((i) => i.id !== issuerId);
  if (removed?.isDefault) {
    const next = store.issuers.find((i) => i.workshopId === workshopId);
    if (next) next.isDefault = true;
  }
  writeStore(store);
}

export function getQuoteTemplate(workshopId: string): QuoteTemplateSettings {
  const store = readStore();
  return ensureTemplate(workshopId, store);
}

export function saveQuoteTemplate(
  workshopId: string,
  input: Partial<Omit<QuoteTemplateSettings, "workshopId">>
): QuoteTemplateSettings {
  const store = readStore();
  const current = ensureTemplate(workshopId, store);
  const updated = { ...current, ...input, workshopId };
  const idx = store.templates.findIndex((t) => t.workshopId === workshopId);
  if (idx >= 0) store.templates[idx] = updated;
  else store.templates.push(updated);
  writeStore(store);
  return updated;
}

export function buildQuoteWhatsAppText(
  payload: CustomerQuotePayload,
  issuer: DocumentIssuer,
  template: QuoteTemplateSettings
): string {
  const total = formatMoney(quoteTotal(payload.items));
  const lines = payload.items
    .map(
      (item, i) =>
        `${i + 1}. ${item.description} — ${item.quantity}x ${formatMoney(item.unitPrice)} = ${formatMoney(item.quantity * item.unitPrice)}`
    )
    .join("\n");

  const validUntil = new Date(payload.issuedAt);
  validUntil.setDate(validUntil.getDate() + template.validityDays);

  return [
    `*${template.documentTitle}*`,
    `*${issuer.tradeName}*`,
    `CNPJ: ${formatCnpj(issuer.cnpj)}`,
    "",
    `Cliente: ${payload.clientName}`,
    payload.vehicle ? `Veículo: ${payload.vehicle}${payload.vehiclePlate ? ` (${payload.vehiclePlate})` : ""}` : "",
    `OS: ${payload.orderId}`,
    "",
    "*Serviços:*",
    lines,
    "",
    `*Total: ${total}*`,
    "",
    template.paymentTerms,
    `Validade: ${validUntil.toLocaleDateString("pt-BR")} (${template.validityDays} dias)`,
    "",
    template.footerNote,
    "",
    `${issuer.address} — ${issuer.city}/${issuer.state}`,
    issuer.phone,
  ]
    .filter(Boolean)
    .join("\n");
}

export function orderToDefaultLineItems(service: string, value: number): QuoteLineItem[] {
  return [{ description: service, quantity: 1, unitPrice: value }];
}
