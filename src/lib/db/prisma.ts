import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function resolveDatabaseUrl(raw?: string): string | undefined {
  const url = raw?.trim();
  if (!url) return undefined;

  const params = new URLSearchParams();
  const [base, query = ""] = url.split("?");
  if (query) {
    for (const part of query.split("&")) {
      const [key, value] = part.split("=");
      if (key) params.set(key, value ?? "");
    }
  }

  if (!params.has("sslmode") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
    params.set("sslmode", "require");
  }
  if (!params.has("connect_timeout")) {
    params.set("connect_timeout", "30");
  }

  const serialized = params.toString();
  return serialized ? `${base}?${serialized}` : base;
}

const databaseUrl = resolveDatabaseUrl(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
  });

globalForPrisma.prisma = prisma;

export function isDatabaseConfigured(): boolean {
  return Boolean(databaseUrl);
}

type ReachabilityCache = { value: boolean; expiresAt: number };

let dbReachableCache: ReachabilityCache | null = null;

const DB_PROBE_MS = 20_000;
const DB_PROBE_RETRIES = 4;
const CACHE_OK_MS = 60_000;
const CACHE_FAIL_MS = 5_000;

export function isPrismaConnectionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  const code = "code" in err ? String((err as { code?: string }).code ?? "") : "";
  return (
    code.startsWith("P100") ||
    code.startsWith("P101") ||
    msg.includes("connect") ||
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("econnrefused") ||
    msg.includes("can't reach database server") ||
    msg.includes("connection pool")
  );
}

export function formatDatabaseError(err: unknown): string {
  if (!(err instanceof Error)) return "Erro desconhecido ao conectar.";
  const msg = err.message;
  if (msg.toLowerCase().includes("password authentication failed")) {
    return "Senha do banco incorreta no servidor (DATABASE_URL desatualizada).";
  }
  if (msg.toLowerCase().includes("does not exist")) {
    return "Banco ou usuário inválido na DATABASE_URL.";
  }
  if (isPrismaConnectionError(err)) {
    return "Não foi possível alcançar o PostgreSQL (Neon).";
  }
  return msg.split("\n")[0];
}

async function probeDatabaseOnce(): Promise<void> {
  await Promise.race([
    (async () => {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
    })(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), DB_PROBE_MS)
    ),
  ]);
}

export async function isDatabaseReachable(force = false): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;

  const now = Date.now();
  if (!force && dbReachableCache && dbReachableCache.expiresAt > now) {
    return dbReachableCache.value;
  }

  for (let attempt = 0; attempt < DB_PROBE_RETRIES; attempt += 1) {
    try {
      await probeDatabaseOnce();
      dbReachableCache = { value: true, expiresAt: Date.now() + CACHE_OK_MS };
      return true;
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        console.error(`[db] probe attempt ${attempt + 1} failed:`, formatDatabaseError(err));
      }
      if (attempt < DB_PROBE_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }
  }

  dbReachableCache = { value: false, expiresAt: Date.now() + CACHE_FAIL_MS };
  return false;
}

export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  attempts = 4
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      resetDatabaseReachableCache();
      const result = await operation();
      dbReachableCache = { value: true, expiresAt: Date.now() + CACHE_OK_MS };
      return result;
    } catch (err) {
      lastError = err;
      if (!isPrismaConnectionError(err) || attempt >= attempts - 1) {
        throw err;
      }
      if (process.env.NODE_ENV === "production") {
        console.error(`[db] retry ${attempt + 1}/${attempts}:`, formatDatabaseError(err));
      }
      await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
    }
  }
  throw lastError;
}

/** Chame após subir o Postgres para reconectar sem reiniciar o dev server. */
export function resetDatabaseReachableCache(): void {
  dbReachableCache = null;
}

export async function checkDatabaseHealth(): Promise<{
  configured: boolean;
  ok: boolean;
  latencyMs?: number;
  error?: string;
  host?: string;
  usesPooler?: boolean;
}> {
  if (!isDatabaseConfigured()) {
    return { configured: false, ok: false, error: "DATABASE_URL não configurada." };
  }

  let host: string | undefined;
  let usesPooler: boolean | undefined;
  try {
    const normalized = databaseUrl!.replace(/^postgresql:\/\//, "https://");
    const parsed = new URL(normalized);
    host = parsed.hostname;
    usesPooler = host.includes("-pooler") || host.includes("pooler");
  } catch {
    host = undefined;
  }

  const started = Date.now();
  try {
    await probeDatabaseOnce();
    return {
      configured: true,
      ok: true,
      latencyMs: Date.now() - started,
      host,
      usesPooler,
    };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      latencyMs: Date.now() - started,
      error: formatDatabaseError(err),
      host,
      usesPooler,
    };
  }
}
