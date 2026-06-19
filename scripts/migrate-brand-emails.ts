import { PrismaClient } from "@prisma/client";
import { DEMO_EMAIL_DOMAIN, LEGACY_DEMO_EMAIL_DOMAIN } from "../src/lib/brand";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: `@${LEGACY_DEMO_EMAIL_DOMAIN}` } },
    select: { id: true, email: true },
  });

  if (users.length === 0) {
    console.log("Nenhum e-mail legado para migrar.");
    return;
  }

  for (const user of users) {
    const localPart = user.email.split("@")[0];
    const newEmail = `${localPart}@${DEMO_EMAIL_DOMAIN}`;
    const conflict = await prisma.user.findUnique({ where: { email: newEmail } });
    if (conflict && conflict.id !== user.id) {
      console.warn(`Ignorado ${user.email}: ${newEmail} já existe.`);
      continue;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { email: newEmail },
    });
    console.log(`${user.email} → ${newEmail}`);
  }

  console.log("Migração de e-mails concluída.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
