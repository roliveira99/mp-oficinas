import { NextResponse } from "next/server";
import { createWorkshop, deleteWorkshop, listAdminWorkshops } from "@/lib/db/admin";
import { getRequestUser, userHasPermission } from "@/lib/db/request-auth";
import type { WorkshopType } from "@prisma/client";

export async function GET() {
  const user = await getRequestUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (!userHasPermission(user, "admin.visualizar_oficinas")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }
  const workshops = await listAdminWorkshops();
  return NextResponse.json({ workshops });
}

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) {
    return NextResponse.json({ error: "Sessão expirada. Faça login novamente." }, { status: 401 });
  }
  if (!userHasPermission(user, "admin.aprovar_oficinas")) {
    return NextResponse.json({ error: "Sem permissão para cadastrar oficinas." }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const result = await createWorkshop({
    name: body.name as string,
    type: body.type as WorkshopType,
    description: body.description as string,
    address: body.address as string,
    city: body.city as string,
    state: body.state as string,
    phone: body.phone as string,
    whatsapp: body.whatsapp as string | undefined,
    email: body.email as string,
    openingHours: body.openingHours as string | undefined,
    tagline: body.tagline as string | undefined,
    owner:
      body.ownerName && body.ownerEmail && body.ownerPassword
        ? {
            name: body.ownerName as string,
            email: body.ownerEmail as string,
            password: body.ownerPassword as string,
          }
        : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getRequestUser();
  if (!user) {
    return NextResponse.json({ error: "Sessão expirada. Faça login novamente." }, { status: 401 });
  }
  if (!userHasPermission(user, "admin.bloquear_oficinas")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

  const result = await deleteWorkshop(id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
