import { NextResponse } from "next/server";
import {
  approveBudget,
  createBudget,
  listBudgets,
  markBudgetSent,
  rejectBudget,
  updateBudget,
} from "@/lib/db/budgets";
import { getRequestUser, userHasPermission } from "@/lib/db/request-auth";
import type { MechanicKind } from "@/types/client";
import type { DocumentLineItem } from "@/types/document-line";

export async function GET(request: Request) {
  const user = await getRequestUser();
  if (!user?.workshopId) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  let budgets = await listBudgets(
    user.workshopId,
    status ? (status.split(",") as import("@prisma/client").BudgetStatus[]) : undefined
  );
  if (user.role === "mecanico") {
    budgets = budgets.filter(
      (b) => b.createdById === user.id || (b.mechanicId === user.id && b.mechanicKind === "platform")
    );
  }
  return NextResponse.json({ budgets });
}

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user?.workshopId) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const action = body.action as string;
  const workshopId = user.workshopId;

  const canManage =
    userHasPermission(user, "owner.aprovar_orcamentos") ||
    userHasPermission(user, "gerencia.aprovar_orcamentos") ||
    userHasPermission(user, "owner.criar_orcamento") ||
    userHasPermission(user, "gerencia.criar_orcamento") ||
    userHasPermission(user, "mecanico.criar_orcamento");

  if (!canManage) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  switch (action) {
    case "create": {
      const result = await createBudget(workshopId, {
        vehicleId: (body.vehicleId as string | null | undefined) ?? null,
        lineItems: body.lineItems as DocumentLineItem[],
        paymentMethods: body.paymentMethods as string[] | undefined,
        mechanicId: body.mechanicId as string | undefined,
        mechanicKind: body.mechanicKind as MechanicKind | undefined,
        mechanicName: body.mechanicName as string | undefined,
        notes: body.notes as string | undefined,
        createdById: user.id,
      });
      return NextResponse.json(result);
    }
    case "update": {
      const result = await updateBudget(workshopId, body.budgetId as string, {
        lineItems: body.lineItems as DocumentLineItem[] | undefined,
        paymentMethods: body.paymentMethods as string[] | undefined,
        notes: body.notes as string | undefined,
        mechanicId: body.mechanicId as string | undefined,
        mechanicKind: body.mechanicKind as MechanicKind | undefined,
        mechanicName: body.mechanicName as string | undefined,
      });
      return NextResponse.json(result);
    }
    case "approve": {
      const result = await approveBudget(workshopId, body.budgetId as string);
      return NextResponse.json(result);
    }
    case "reject": {
      const result = await rejectBudget(workshopId, body.budgetId as string);
      return NextResponse.json(result);
    }
    case "sent": {
      const ok = await markBudgetSent(workshopId, body.budgetId as string);
      return NextResponse.json({ ok });
    }
    default:
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }
}
