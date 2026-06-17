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
import {
  formatDatabaseError,
  isDatabaseConfigured,
  isPrismaConnectionError,
  prisma,
  withDatabaseRetry,
} from "@/lib/db/prisma";

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
        {
          error:
            "DATABASE_URL não está configurada no Render. Cole a connection string do Neon em Environment.",
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

  try {
    const response = await withDatabaseRetry(async () => {
      const result = await loginWithDatabase(email, password);
      if (!result) {
        return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
      }
      return result;
    });

    return response;
  } catch (err) {
    console.error("[auth/login] database error:", err);

    const detail = formatDatabaseError(err);
    const hint =
      detail.includes("Senha do banco") || detail.includes("DATABASE_URL")
        ? " Atualize DATABASE_URL no Render com a URL atual do painel Neon (Connection string → Pooled)."
        : " Confira https://mp-oficinas.onrender.com/api/health/db e se o Neon está ativo.";

    return NextResponse.json(
      {
        error: `Banco de dados indisponível: ${detail}.${hint}`,
        code: isPrismaConnectionError(err) ? "db_connection" : "db_error",
      },
      { status: 503 }
    );
  }
}
