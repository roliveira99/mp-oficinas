import { NextResponse } from "next/server";
import { getFinanceOverview } from "@/lib/db/finance";
import { listBudgets } from "@/lib/db/budgets";
import { listServiceNotes } from "@/lib/db/service-notes";
import { prisma } from "@/lib/db/prisma";
import { getRequestUser, userHasPermission } from "@/lib/db/request-auth";

export async function GET() {
  const user = await getRequestUser();
  if (!user?.workshopId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const canView =
    userHasPermission(user, "owner.relatorios_financeiros") ||
    userHasPermission(user, "owner.relatorios_operacionais") ||
    userHasPermission(user, "gerencia.relatorios_operacionais");
  if (!canView) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const workshopId = user.workshopId;
  const [workshop, finance, notes, budgets, vehicles, clients] = await Promise.all([
    prisma.workshop.findUnique({ where: { id: workshopId }, select: { name: true } }),
    getFinanceOverview(workshopId),
    listServiceNotes(workshopId),
    listBudgets(workshopId),
    prisma.crmVehicle.count({ where: { workshopId } }),
    prisma.crmClient.count({ where: { workshopId } }),
  ]);

  const activeNotes = notes.filter((n) => n.status !== "cancelada");
  const notesTotal = activeNotes.reduce((s, n) => s + n.total, 0);
  const budgetsPending = budgets.filter((b) => b.status === "aguardando_aprovacao").length;
  const budgetsApproved = budgets.filter((b) => b.status === "aprovado").length;

  const report = {
    generatedAt: new Date().toISOString(),
    workshopName: workshop?.name ?? "Oficina",
    summary: {
      revenueFromNotes: finance.revenueFromNotes,
      receivablesOpen: finance.receivablesOpen,
      payablesOpen: finance.payablesOpen,
      receivablesPaid: finance.receivablesPaid,
      payablesPaid: finance.payablesPaid,
      commissionsPaid: finance.commissionsPaid,
      commissionsPending: finance.commissionsPending,
      balance: finance.balance,
      serviceNotesCount: activeNotes.length,
      serviceNotesTotal: notesTotal,
      budgetsPending,
      budgetsApproved,
      vehiclesRegistered: vehicles,
      clientsRegistered: clients,
    },
    serviceNotes: activeNotes.slice(0, 100).map((n) => ({
      id: n.id,
      vehicle: n.vehiclePlate,
      mechanic: n.mechanicName,
      total: n.total,
      commission: n.commissionAmount,
      date: n.issuedAt,
      status: n.status,
    })),
    financialEntries: finance.entries.map((e) => ({
      name: e.name,
      kind: e.kind,
      amount: e.amount,
      dueAt: e.dueAt,
      paid: e.paid,
      installments: e.installments?.length ?? 0,
      isRecurring: e.isRecurring,
    })),
  };

  return NextResponse.json(report);
}
