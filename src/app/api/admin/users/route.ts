import { NextResponse } from "next/server";
import { createPlatformUser, deletePlatformUser, listAdminUsers } from "@/lib/db/admin";
import { getRequestUser, userHasPermission } from "@/lib/db/request-auth";

export async function GET() {
  const user = await getRequestUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (!userHasPermission(user, "admin.criar_contas")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }
  const users = await listAdminUsers();
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) {
    return NextResponse.json({ error: "Sessão expirada. Faça login novamente." }, { status: 401 });
  }
  if (!userHasPermission(user, "admin.criar_contas")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const result = await createPlatformUser({
    name: body.name as string,
    email: body.email as string,
    password: body.password as string,
    role: body.role as "dono" | "gerencia" | "mecanico",
    workshopId: body.workshopId as string,
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
  if (!userHasPermission(user, "admin.criar_contas")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

  const result = await deletePlatformUser(id, user.email);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
