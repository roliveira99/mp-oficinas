import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import {
  ADMIN_EMAIL,
  LEGACY_DEMO_EMAIL_DOMAIN,
} from "../src/lib/brand";

const prisma = new PrismaClient();

const LEGACY_ADMIN_EMAIL = `admin@${LEGACY_DEMO_EMAIL_DOMAIN}`;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

async function main() {
  console.log("Reset de produção — removendo dados demo...");

  const legacyAdmin = await prisma.user.findUnique({
    where: { email: LEGACY_ADMIN_EMAIL },
  });
  if (legacyAdmin) {
    await prisma.user.update({
      where: { id: legacyAdmin.id },
      data: { email: ADMIN_EMAIL },
    });
  }

  await prisma.$transaction([
    prisma.session.deleteMany(),
    prisma.agendaRequest.deleteMany(),
    prisma.supplierContact.deleteMany(),
    prisma.fictionalMechanic.deleteMany(),
    prisma.crmServiceOrder.deleteMany(),
    prisma.crmVehicle.deleteMany(),
    prisma.crmClient.deleteMany(),
    prisma.review.deleteMany(),
    prisma.sponsorship.deleteMany(),
    prisma.siteAnnouncement.deleteMany(),
    prisma.user.deleteMany({ where: { email: { not: ADMIN_EMAIL } } }),
    prisma.workshop.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      name: "Administrador Master",
      role: "master",
      workshopId: null,
    },
    update: {
      passwordHash,
      name: "Administrador Master",
      role: "master",
      workshopId: null,
    },
  });

  console.log("Plataforma limpa. Apenas admin master:");
  console.log(`  E-mail: ${ADMIN_EMAIL}`);
  console.log(`  Senha:  ${ADMIN_PASSWORD === "admin123" ? "admin123 (troque ADMIN_PASSWORD no .env antes do reset)" : "(definida via ADMIN_PASSWORD)"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
