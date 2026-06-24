/**
 * Migra CrmVehicle para o modelo genérico (referenceKey, label, assetType)
 * antes do prisma db push adicionar colunas obrigatórias.
 */
import { prisma } from "../src/lib/db/prisma";

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = ${table} AND column_name = ${column}
    ) AS exists
  `;
  return rows[0]?.exists ?? false;
}

async function main() {
  const hasAssetType = await columnExists("CrmVehicle", "assetType");
  const hasReferenceKey = await columnExists("CrmVehicle", "referenceKey");
  const hasLabel = await columnExists("CrmVehicle", "label");

  if (!hasAssetType) {
    await prisma.$executeRawUnsafe(`
      CREATE TYPE "BusinessAssetType" AS ENUM ('vehicle', 'generic', 'pet', 'property', 'order');
    `).catch(() => {
      /* enum may already exist from partial push */
    });
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CrmVehicle" ADD COLUMN IF NOT EXISTS "assetType" "BusinessAssetType" NOT NULL DEFAULT 'vehicle';
    `);
  }

  if (!hasReferenceKey) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CrmVehicle" ADD COLUMN IF NOT EXISTS "referenceKey" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      UPDATE "CrmVehicle" SET "referenceKey" = UPPER(TRIM("plate")) WHERE "referenceKey" IS NULL OR "referenceKey" = '';
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CrmVehicle" ALTER COLUMN "referenceKey" SET NOT NULL;
    `);
  }

  if (!hasLabel) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CrmVehicle" ADD COLUMN IF NOT EXISTS "label" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      UPDATE "CrmVehicle" SET "label" = TRIM("model") WHERE "label" IS NULL OR "label" = '';
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CrmVehicle" ALTER COLUMN "label" SET NOT NULL;
    `);
  }

  await prisma.$executeRawUnsafe(`
    DROP INDEX IF EXISTS "CrmVehicle_workshopId_plate_key";
  `).catch(() => undefined);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "CrmVehicle_workshopId_referenceKey_key"
    ON "CrmVehicle" ("workshopId", "referenceKey");
  `).catch(() => undefined);

  console.log("Migração de ativos concluída.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
