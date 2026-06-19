import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { APP_NAME, getAppUrl } from "@/lib/brand";
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
  getDatabaseUrlValidationError,
  isDatabaseConfigured,
  isPrismaConnectionError,
  prisma,
  withDatabaseRetry,
} from "@/lib/db/prisma";

const isProduction = process.env.NODE_ENV === "production";

async function loginWithDatabase(
  email: string,
  password: string
): Promise<
  | { status: "ok"; response: NextResponse }
  | { status: "invalid" }
  | { status: "blocked" }
> {
  const dbUser = await prisma.user.findUnique({
    where: { email },
    include: { workshop: { select: { name: true, blocked: true } } },
  });

  if (!dbUser || !(await bcrypt.compare(password, dbUser.passwordHash))) {
    return { status: "invalid" };
  }

  if (dbUser.role !== "master" && dbUser.workshop?.blocked) {
    return { status: "blocked" };
  }

  const user = toAuthUser(dbUser, dbUser.workshop?.name ?? null);
  const token = await createSession(dbUser.id);
  const expiresAt = newSessionExpiry();
  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return { status: "ok", response };
}

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
  }

  const urlError = getDatabaseUrlValidationError(process.env.DATABASE_URL);
  if (urlError) {
    return NextResponse.json(
      {
        error: `${urlError} No Render, cole só a URL (postgresql://...) sem aspas e sem "DATABASE_URL=".`,
        code: "db_config",
      },
      { status: 503 }
    );
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
    const loginResult = await withDatabaseRetry(async () => loginWithDatabase(email, password));

    if (loginResult.status === "invalid") {
      return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }
    if (loginResult.status === "blocked") {
      return NextResponse.json(
        { error: `Acesso suspenso. Entre em contato com o suporte ${APP_NAME}.` },
        { status: 403 }
      );
    }
    return loginResult.response;
  } catch (err) {
    console.error("[auth/login] database error:", err);

    const detail = formatDatabaseError(err);
    const hint =
      detail.includes("Senha do banco") || detail.includes("DATABASE_URL")
        ? " Atualize DATABASE_URL no Render com a URL atual do painel Neon (Connection string → Pooled)."
        : ` Confira ${getAppUrl()}/api/health/db e se o Neon está ativo.`;

    return NextResponse.json(
      {
        error: `Banco de dados indisponível: ${detail}.${hint}`,
        code: isPrismaConnectionError(err) ? "db_connection" : "db_error",
      },
      { status: 503 }
    );
  }
}
