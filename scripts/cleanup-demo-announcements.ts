import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const removed = await prisma.siteAnnouncement.deleteMany({
    where: {
      OR: [
        { id: "ann-seed-1" },
        { title: { equals: "Teste", mode: "insensitive" } },
      ],
    },
  });
  console.log(`Anúncios de demo removidos: ${removed.count}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
