import { NextResponse } from "next/server";
import { DEMO_ACCOUNTS } from "@/lib/auth";
import { getRequestUser } from "@/lib/db/request-auth";
import { isDatabaseConfigured, isDatabaseReachable } from "@/lib/db/prisma";

export async function GET() {
  const user = await getRequestUser();
  if (user) {
    return NextResponse.json({ user });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ user: null, dbConfigured: false });
  }

  const reachable = await isDatabaseReachable();
  if (!reachable && process.env.NODE_ENV !== "production") {
    return NextResponse.json({ user: null, offline: true });
  }

  return NextResponse.json({ user: null, dbConfigured: true, dbReachable: reachable });
}

/** Fallback offline (somente desenvolvimento). */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Indisponível em produção." }, { status: 400 });
  }

  if (await isDatabaseReachable()) {
    return NextResponse.json({ error: "Use login com banco configurado." }, { status: 400 });
  }

  const body = (await request.json()) as { email?: string; password?: string };
  const account = DEMO_ACCOUNTS.find(
    (a) => a.email === body.email && a.password === body.password
  );

  if (!account) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  return NextResponse.json({ user: account.user, offline: true });
}
