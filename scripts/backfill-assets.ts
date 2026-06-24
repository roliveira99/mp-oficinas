/**
 * Preenche referenceKey, label e assetType em CrmVehicle existentes.
 * Rode após db:push com as novas colunas.
 */
import { prisma } from "../src/lib/db/prisma";

async function main() {
  const vehicles = await prisma.crmVehicle.findMany({
    where: {
      OR: [{ referenceKey: "" }, { label: "" }],
    },
  });

  let updated = 0;
  for (const v of vehicles) {
    await prisma.crmVehicle.update({
      where: { id: v.id },
      data: {
        referenceKey: v.referenceKey || v.plate,
        label: v.label || v.model,
        assetType: v.assetType ?? "vehicle",
      },
    });
    updated += 1;
  }

  const all = await prisma.crmVehicle.findMany();
  for (const v of all) {
    if (!v.referenceKey || !v.label) {
      await prisma.crmVehicle.update({
        where: { id: v.id },
        data: {
          referenceKey: v.referenceKey || v.plate,
          label: v.label || v.model,
          assetType: v.assetType ?? "vehicle",
        },
      });
      updated += 1;
    }
  }

  console.log(`Backfill concluído: ${updated} registro(s) atualizado(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
