import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

type ReachabilityCache = { value: boolean; expiresAt: number };

let dbReachableCache: ReachabilityCache | null = null;

const DB_PROBE_MS = 8000;
const DB_PROBE_RETRIES = 3;
const CACHE_OK_MS = 60_000;
const CACHE_FAIL_MS = 10_000;

async function probeDatabaseOnce(): Promise<boolean> {
  await Promise.race([
    prisma.$queryRaw`SELECT 1`,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), DB_PROBE_MS)
    ),
  ]);
  return true;
}

export async function isDatabaseReachable(force = false): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;

  const now = Date.now();
  if (!force && dbReachableCache && dbReachableCache.expiresAt > now) {
    return dbReachableCache.value;
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < DB_PROBE_RETRIES; attempt += 1) {
    try {
      await probeDatabaseOnce();
      dbReachableCache = { value: true, expiresAt: now + CACHE_OK_MS };
      return true;
    } catch (err) {
      lastError = err;
      if (attempt < DB_PROBE_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.error("[db] unreachable after retries:", lastError);
  }

  dbReachableCache = { value: false, expiresAt: now + CACHE_FAIL_MS };
  return false;
}

/** Chame após subir o Postgres para reconectar sem reiniciar o dev server. */
export function resetDatabaseReachableCache(): void {
  dbReachableCache = null;
}
