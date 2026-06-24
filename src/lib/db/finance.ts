import { prisma } from "@/lib/db/prisma";
import type { FinancialEntryKind } from "@prisma/client";
import type { FinanceInstallment, FinancialEntryRecord } from "@/types/finance";
import { isActiveServiceNoteStatus } from "@/lib/db/service-notes";

export type { FinancialEntryRecord };

export interface FinanceOverview {
  revenueFromNotes: number;
  commissionsPaid: number;
  commissionsPending: number;
  receivablesOpen: number;
  payablesOpen: number;
  receivablesPaid: number;
  payablesPaid: number;
  balance: number;
  entries: FinancialEntryRecord[];
}

function mapEntry(row: {
  id: string;
  kind: FinancialEntryKind;
  name: string;
  amount: number;
  dueAt: Date | null;
  paid: boolean;
  paidAt: Date | null;
  serviceNoteId: string | null;
  installments: unknown;
  isRecurring: boolean;
  recurringActive: boolean;
  reminderDayBefore: boolean;
  reminderSameDay: boolean;
}): FinancialEntryRecord {
  const installments = (row.installments as FinanceInstallment[] | null) ?? null;
  const allInstallmentsPaid = installments ? installments.every((i) => i.paid) : row.paid;

  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    amount: row.amount,
    dueAt: row.dueAt?.toISOString() ?? null,
    paid: installments?.length ? allInstallmentsPaid : row.paid,
    paidAt: row.paidAt?.toISOString() ?? null,
    serviceNoteId: row.serviceNoteId,
    installments,
    isRecurring: row.isRecurring,
    recurringActive: row.recurringActive,
    reminderDayBefore: row.reminderDayBefore,
    reminderSameDay: row.reminderSameDay,
  };
}

function buildInstallments(
  total: number,
  count: number,
  firstDue: Date
): FinanceInstallment[] {
  const base = Math.floor((total / count) * 100) / 100;
  const items: FinanceInstallment[] = [];
  let allocated = 0;
  for (let i = 0; i < count; i++) {
    const amount = i === count - 1 ? Math.round((total - allocated) * 100) / 100 : base;
    allocated += amount;
    const due = new Date(firstDue);
    due.setMonth(due.getMonth() + i);
    items.push({
      number: i + 1,
      amount,
      dueAt: due.toISOString(),
      paid: false,
    });
  }
  return items;
}

export async function getFinanceOverview(workshopId: string): Promise<FinanceOverview> {
  const [notes, entries] = await Promise.all([
    prisma.serviceNote.findMany({ where: { workshopId } }),
    prisma.financialEntry.findMany({ where: { workshopId }, orderBy: { dueAt: "asc" } }),
  ]);

  const revenueFromNotes = notes
    .filter((n) => isActiveServiceNoteStatus(n.status))
    .reduce((s, n) => s + n.total, 0);
  const commissionsPaid = notes
    .filter((n) => isActiveServiceNoteStatus(n.status) && n.commissionPaid)
    .reduce((s, n) => s + (n.commissionAmount ?? 0), 0);
  const commissionsPending = notes
    .filter((n) => isActiveServiceNoteStatus(n.status) && !n.commissionPaid && n.commissionAmount)
    .reduce((s, n) => s + (n.commissionAmount ?? 0), 0);

  const mapped = entries.map(mapEntry);

  const entryOpen = (e: FinancialEntryRecord) => {
    if (e.installments?.length) {
      return e.installments.filter((i) => !i.paid).reduce((s, i) => s + i.amount, 0);
    }
    return e.paid ? 0 : e.amount;
  };

  const entryPaid = (e: FinancialEntryRecord) => {
    if (e.installments?.length) {
      return e.installments.filter((i) => i.paid).reduce((s, i) => s + i.amount, 0);
    }
    return e.paid ? e.amount : 0;
  };

  const receivablesOpen = mapped
    .filter((e) => e.kind === "receber")
    .reduce((s, e) => s + entryOpen(e), 0);
  const payablesOpen = mapped
    .filter((e) => e.kind === "pagar")
    .reduce((s, e) => s + entryOpen(e), 0);
  const paidReceivables = mapped
    .filter((e) => e.kind === "receber")
    .reduce((s, e) => s + entryPaid(e), 0);
  const paidPayables = mapped
    .filter((e) => e.kind === "pagar")
    .reduce((s, e) => s + entryPaid(e), 0);

  return {
    revenueFromNotes,
    commissionsPaid,
    commissionsPending,
    receivablesOpen,
    payablesOpen,
    receivablesPaid: paidReceivables,
    payablesPaid: paidPayables,
    balance: paidReceivables - paidPayables - commissionsPaid,
    entries: mapped,
  };
}

export async function createFinancialEntry(
  workshopId: string,
  input: {
    kind: FinancialEntryKind;
    name: string;
    amount: number;
    dueAt?: string;
    installmentCount?: number;
    isRecurring?: boolean;
    reminderDayBefore?: boolean;
    reminderSameDay?: boolean;
  }
): Promise<FinancialEntryRecord> {
  const firstDue = input.dueAt ? new Date(input.dueAt) : new Date();
  const count = input.installmentCount && input.installmentCount > 1 ? input.installmentCount : 1;
  const installments =
    count > 1 ? buildInstallments(input.amount, count, firstDue) : null;

  const row = await prisma.financialEntry.create({
    data: {
      workshopId,
      kind: input.kind,
      name: input.name.trim(),
      amount: input.amount,
      dueAt: firstDue,
      installments: installments as object | undefined,
      isRecurring: input.isRecurring ?? false,
      recurringActive: input.isRecurring ?? false,
      reminderDayBefore: input.reminderDayBefore ?? true,
      reminderSameDay: input.reminderSameDay ?? true,
    },
  });

  return mapEntry(row);
}

export async function markFinancialEntryPaid(
  workshopId: string,
  entryId: string,
  paid: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await prisma.financialEntry.findFirst({ where: { id: entryId, workshopId } });
  if (!existing) return { ok: false, error: "Lançamento não encontrado." };

  const installments = existing.installments as FinanceInstallment[] | null;
  if (installments?.length) {
    const updated = installments.map((i) =>
      paid ? { ...i, paid: true, paidAt: new Date().toISOString() } : { ...i, paid: false, paidAt: null }
    );
    await prisma.financialEntry.update({
      where: { id: entryId },
      data: { installments: updated as object, paid, paidAt: paid ? new Date() : null },
    });
  } else {
    await prisma.financialEntry.updateMany({
      where: { id: entryId, workshopId },
      data: { paid, paidAt: paid ? new Date() : null },
    });
  }

  if (paid && existing.isRecurring && existing.recurringActive) {
    const nextDue = existing.dueAt ? new Date(existing.dueAt) : new Date();
    nextDue.setMonth(nextDue.getMonth() + 1);
    await prisma.financialEntry.create({
      data: {
        workshopId,
        kind: existing.kind,
        name: existing.name,
        amount: existing.amount,
        dueAt: nextDue,
        installments: existing.installments ?? undefined,
        isRecurring: true,
        recurringActive: true,
        reminderDayBefore: existing.reminderDayBefore,
        reminderSameDay: existing.reminderSameDay,
      },
    });
  }

  return { ok: true };
}

export async function markInstallmentPaid(
  workshopId: string,
  entryId: string,
  installmentNumber: number,
  paid: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await prisma.financialEntry.findFirst({ where: { id: entryId, workshopId } });
  if (!existing) return { ok: false, error: "Lançamento não encontrado." };
  const installments = (existing.installments as FinanceInstallment[] | null) ?? [];
  if (!installments.length) return { ok: false, error: "Este lançamento não possui parcelas." };

  const updated = installments.map((i) =>
    i.number === installmentNumber
      ? { ...i, paid, paidAt: paid ? new Date().toISOString() : null, anticipated: false, anticipatedAt: null }
      : i
  );
  const allPaid = updated.every((i) => i.paid);

  await prisma.financialEntry.update({
    where: { id: entryId },
    data: {
      installments: updated as object,
      paid: allPaid,
      paidAt: allPaid ? new Date() : null,
    },
  });
  return { ok: true };
}

export async function anticipateInstallments(
  workshopId: string,
  entryId: string,
  installmentNumbers: number[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await prisma.financialEntry.findFirst({ where: { id: entryId, workshopId } });
  if (!existing) return { ok: false, error: "Lançamento não encontrado." };
  const installments = (existing.installments as FinanceInstallment[] | null) ?? [];
  if (!installments.length) return { ok: false, error: "Sem parcelas." };

  const now = new Date().toISOString();
  const updated = installments.map((i) =>
    installmentNumbers.includes(i.number)
      ? { ...i, paid: true, paidAt: now, anticipated: true, anticipatedAt: now }
      : i
  );
  const allPaid = updated.every((i) => i.paid);

  await prisma.financialEntry.update({
    where: { id: entryId },
    data: { installments: updated as object, paid: allPaid, paidAt: allPaid ? new Date() : null },
  });
  return { ok: true };
}

export async function finishRecurring(
  workshopId: string,
  entryId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await prisma.financialEntry.updateMany({
    where: { id: entryId, workshopId },
    data: { recurringActive: false },
  });
  if (result.count === 0) return { ok: false, error: "Lançamento não encontrado." };
  return { ok: true };
}
