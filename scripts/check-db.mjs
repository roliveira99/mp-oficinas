#!/usr/bin/env node
/**
 * Verifica conexão com PostgreSQL antes de db:push / db:seed.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    console.error("❌ DATABASE_URL inválida no .env");
    console.error("   Exemplo: postgresql://usuario:senha@localhost:5432/pesquisaaqui");
    process.exit(1);
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ PostgreSQL conectado com sucesso.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Não foi possível conectar ao PostgreSQL.\n");
    console.error("   Erro:", err instanceof Error ? err.message.split("\n")[0] : err);
    console.error("\n📋 Opções para resolver:\n");
    console.error("   1) Docker Desktop → npm run db:docker  (sobe Postgres local)");
    console.error("   2) Neon gratuito → https://neon.tech → copie a URL para .env");
    console.error("   3) Instalador Windows → https://www.postgresql.org/download/windows/");
    console.error("\n   Depois: npm run db:setup && npm run dev\n");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
