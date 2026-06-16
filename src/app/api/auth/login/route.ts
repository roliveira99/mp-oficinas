import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { DEMO_ACCOUNTS } from "@/lib/auth";
import {
  createSession,
  newSessionExpiry,
  sessionCookieOptions,
  SESSION_COOKIE,
  toAuthUser,
} from "@/lib/db/auth";
import { isDatabaseConfigured, isDatabaseReachable, prisma, resetDatabaseReachableCache } from "@/lib/db/prisma";

const isProduction = process.env.NODE_ENV === "production";

async function loginWithDatabase(email: string, password: string) {
  const dbUser = await prisma.user.findUnique({
    where: { email },
    include: { workshop: { select: { name: true } } },
  });

  if (!dbUser || !(await bcrypt.compare(password, dbUser.passwordHash))) {
    return null;
  }

  const user = toAuthUser(dbUser, dbUser.workshop?.name ?? null);
  const token = await createSession(dbUser.id);
  const expiresAt = newSessionExpiry();
  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return response;
}

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
  }

  if (!isDatabaseConfigured()) {
    if (isProduction) {
      return NextResponse.json(
        { error: "Banco de dados não configurado no servidor. Contate o administrador." },
        { status: 503 }
      );
    }

    const account = DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email && a.password === password
    );
    if (!account) {
      return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }
    return NextResponse.json({ user: account.user, offline: true });
  }

  resetDatabaseReachableCache();
  const reachable = await isDatabaseReachable(true);

  if (reachable) {
    try {
      const response = await loginWithDatabase(email, password);
      if (response) return response;
      return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    } catch (err) {
      console.error("[auth/login] database error:", err);
      return NextResponse.json(
        {
          error:
            "Não foi possível conectar ao banco de dados. Aguarde alguns segundos e tente novamente.",
        },
        { status: 503 }
      );
    }
  }

  if (isProduction) {
    return NextResponse.json(
      {
        error:
          "Banco de dados indisponível no momento. Aguarde alguns segundos e tente o login novamente.",
      },
      { status: 503 }
    );
  }

  const account = DEMO_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email && a.password === password
  );
  if (!account) {
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }
  return NextResponse.json({ user: account.user, offline: true });
}
