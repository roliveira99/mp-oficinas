import { prisma } from "@/lib/db/prisma";
import type { MechanicKind } from "@/types/client";

export interface EmployeeCompRecord {
  id: string;
  userId: string | null;
  fictionalMechanicId: string | null;
  name: string;
  kind: MechanicKind | "staff";
  salary: number;
  commissionRate: number;
}

export interface SalaryAdvanceRecord {
  id: string;
  userId: string | null;
  fictionalMechanicId: string | null;
  employeeName: string;
  amount: number;
  date: string;
  notes: string | null;
}

export interface RhMechanicSummary {
  mechanicId: string;
  mechanicKind: MechanicKind;
  name: string;
  salary: number;
  commissionRate: number;
  notesCount: number;
  commissionTotal: number;
  commissionPaid: number;
  commissionPending: number;
  advancesTotal: number;
  netToReceive: number;
}

export async function getRhOverview(workshopId: string): Promise<{
  employees: EmployeeCompRecord[];
  advances: SalaryAdvanceRecord[];
  mechanicSummaries: RhMechanicSummary[];
}> {
  const [comps, advances, notes, fictional, users] = await Promise.all([
    prisma.employeeCompensation.findMany({ where: { workshopId } }),
    prisma.salaryAdvance.findMany({ where: { workshopId }, orderBy: { date: "desc" } }),
    prisma.serviceNote.findMany({ where: { workshopId, status: { in: ["emitida", "paga"] } } }),
    prisma.fictionalMechanic.findMany({ where: { workshopId, active: true } }),
    prisma.user.findMany({ where: { workshopId, role: "mecanico" } }),
  ]);

  const nameMap = new Map<string, string>();
  for (const f of fictional) nameMap.set(`fictional:${f.id}`, f.name);
  for (const u of users) nameMap.set(`platform:${u.id}`, u.name);

  const employees: EmployeeCompRecord[] = [];

  for (const f of fictional) {
    const comp = comps.find((c) => c.fictionalMechanicId === f.id);
    employees.push({
      id: comp?.id ?? `new-fic-${f.id}`,
      userId: null,
      fictionalMechanicId: f.id,
      name: f.name,
      kind: "fictional",
      salary: comp?.salary ?? 0,
      commissionRate: comp?.commissionRate ?? 8,
    });
  }
  for (const u of users) {
    const comp = comps.find((c) => c.userId === u.id);
    employees.push({
      id: comp?.id ?? `new-user-${u.id}`,
      userId: u.id,
      fictionalMechanicId: null,
      name: u.name,
      kind: "platform",
      salary: comp?.salary ?? 0,
      commissionRate: comp?.commissionRate ?? 8,
    });
  }

  const advanceRecords: SalaryAdvanceRecord[] = advances.map((a) => ({
    id: a.id,
    userId: a.userId,
    fictionalMechanicId: a.fictionalMechanicId,
    employeeName:
      nameMap.get(
        a.userId ? `platform:${a.userId}` : `fictional:${a.fictionalMechanicId}`
      ) ?? "—",
    amount: a.amount,
    date: a.date.toISOString(),
    notes: a.notes,
  }));

  const mechanicSummaries: RhMechanicSummary[] = employees
    .filter((e) => e.kind !== "staff")
    .map((emp) => {
      const key = emp.userId ? `platform:${emp.userId}` : `fictional:${emp.fictionalMechanicId}`;
      const mechanicId = emp.userId ?? emp.fictionalMechanicId ?? "";
      const mechanicKind = emp.kind as MechanicKind;
      const empNotes = notes.filter(
        (n) => n.mechanicId === mechanicId && n.mechanicKind === mechanicKind
      );
      const commissionTotal = empNotes.reduce((s, n) => s + (n.commissionAmount ?? 0), 0);
      const commissionPaid = empNotes
        .filter((n) => n.commissionPaid)
        .reduce((s, n) => s + (n.commissionAmount ?? 0), 0);
      const empAdvances = advances.filter(
        (a) =>
          (emp.userId && a.userId === emp.userId) ||
          (emp.fictionalMechanicId && a.fictionalMechanicId === emp.fictionalMechanicId)
      );
      const advancesTotal = empAdvances.reduce((s, a) => s + a.amount, 0);
      const netToReceive = commissionTotal - commissionPaid - advancesTotal;

      return {
        mechanicId,
        mechanicKind,
        name: emp.name,
        salary: emp.salary,
        commissionRate: emp.commissionRate,
        notesCount: empNotes.length,
        commissionTotal,
        commissionPaid,
        commissionPending: commissionTotal - commissionPaid,
        advancesTotal,
        netToReceive,
      };
    });

  return { employees, advances: advanceRecords, mechanicSummaries };
}

export async function upsertEmployeeCompensation(
  workshopId: string,
  input: {
    userId?: string;
    fictionalMechanicId?: string;
    salary: number;
    commissionRate: number;
  }
): Promise<EmployeeCompRecord> {
  const existing = await prisma.employeeCompensation.findFirst({
    where: {
      workshopId,
      ...(input.userId ? { userId: input.userId } : { fictionalMechanicId: input.fictionalMechanicId }),
    },
  });

  const row = existing
    ? await prisma.employeeCompensation.update({
        where: { id: existing.id },
        data: { salary: input.salary, commissionRate: input.commissionRate },
      })
    : await prisma.employeeCompensation.create({
        data: {
          workshopId,
          userId: input.userId ?? null,
          fictionalMechanicId: input.fictionalMechanicId ?? null,
          salary: input.salary,
          commissionRate: input.commissionRate,
        },
      });

  let name = "—";
  if (input.userId) {
    const u = await prisma.user.findUnique({ where: { id: input.userId } });
    name = u?.name ?? name;
  } else if (input.fictionalMechanicId) {
    const f = await prisma.fictionalMechanic.findUnique({ where: { id: input.fictionalMechanicId } });
    name = f?.name ?? name;
  }

  return {
    id: row.id,
    userId: row.userId,
    fictionalMechanicId: row.fictionalMechanicId,
    name,
    kind: input.userId ? "platform" : "fictional",
    salary: row.salary,
    commissionRate: row.commissionRate,
  };
}

export async function addSalaryAdvance(
  workshopId: string,
  input: {
    userId?: string;
    fictionalMechanicId?: string;
    amount: number;
    date: string;
    notes?: string;
  }
): Promise<SalaryAdvanceRecord> {
  const row = await prisma.salaryAdvance.create({
    data: {
      workshopId,
      userId: input.userId ?? null,
      fictionalMechanicId: input.fictionalMechanicId ?? null,
      amount: input.amount,
      date: new Date(input.date),
      notes: input.notes?.trim() || null,
    },
  });

  return {
    id: row.id,
    userId: row.userId,
    fictionalMechanicId: row.fictionalMechanicId,
    employeeName: "—",
    amount: row.amount,
    date: row.date.toISOString(),
    notes: row.notes,
  };
}
