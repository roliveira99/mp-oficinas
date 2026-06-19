import bcrypt from "bcryptjs";
import { Prisma, PrismaClient } from "@prisma/client";
import { APP_NAME } from "../src/lib/brand";
import { DEMO_ACCOUNTS } from "../src/lib/auth";
import { workshops } from "../src/data/workshops";
import { seedReviews, verifiedClientsByWorkshop } from "../src/data/verified-clients";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${APP_NAME}...`);

  for (const workshop of workshops) {
    await prisma.workshop.upsert({
      where: { id: workshop.id },
      create: {
        id: workshop.id,
        name: workshop.name,
        slug: workshop.slug,
        type: workshop.type,
        description: workshop.description,
        tagline: workshop.tagline ?? null,
        address: workshop.address,
        city: workshop.city,
        state: workshop.state,
        phone: workshop.phone,
        whatsapp: workshop.whatsapp,
        email: workshop.email,
        rating: workshop.rating,
        reviewCount: workshop.reviewCount,
        services: workshop.services,
        openingHours: workshop.openingHours,
        image: workshop.image,
        coverImage: workshop.coverImage ?? null,
        gallery: workshop.gallery
          ? (workshop.gallery as Prisma.InputJsonValue)
          : undefined,
        specialties: workshop.specialties,
        hasAgenda: workshop.hasAgenda,
        paymentMethods: workshop.paymentMethods,
        catalog: workshop.catalog,
        mechanicRanking: workshop.mechanicRanking
          ? (workshop.mechanicRanking as Prisma.InputJsonValue)
          : undefined,
      },
      update: {
        name: workshop.name,
        slug: workshop.slug,
        type: workshop.type,
        description: workshop.description,
        tagline: workshop.tagline ?? null,
        rating: workshop.rating,
        reviewCount: workshop.reviewCount,
        coverImage: workshop.coverImage ?? null,
        gallery: workshop.gallery
          ? (workshop.gallery as Prisma.InputJsonValue)
          : undefined,
        catalog: workshop.catalog,
      },
    });
  }

  for (const account of DEMO_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(account.password, 10);
    await prisma.user.upsert({
      where: { email: account.email },
      create: {
        email: account.email,
        passwordHash,
        name: account.user.name,
        role: account.user.role,
        workshopId: account.user.workshopId,
      },
      update: {
        passwordHash,
        name: account.user.name,
        role: account.user.role,
        workshopId: account.user.workshopId,
      },
    });
  }

  for (const review of seedReviews) {
    await prisma.review.upsert({
      where: {
        workshopId_cpf: { workshopId: review.workshopId, cpf: review.cpf },
      },
      create: {
        id: review.id,
        workshopId: review.workshopId,
        cpf: review.cpf,
        clientName: review.clientName,
        stars: review.stars,
        comment: review.comment,
        serviceLabel: review.serviceLabel,
        removed: false,
        createdAt: new Date(review.createdAt),
        updatedAt: new Date(review.updatedAt),
      },
      update: {
        stars: review.stars,
        comment: review.comment,
        serviceLabel: review.serviceLabel,
        removed: false,
        updatedAt: new Date(review.updatedAt),
      },
    });
  }

  for (const [workshopId, clients] of Object.entries(verifiedClientsByWorkshop)) {
    for (const client of clients) {
      const newId = `cli-${workshopId}-${client.cpf}`;
      const legacy = await prisma.crmClient.findUnique({
        where: { workshopId_cpf: { workshopId, cpf: client.cpf } },
      });
      if (legacy && legacy.id !== newId) {
        await prisma.crmClient.delete({ where: { id: legacy.id } });
      }
      await prisma.crmClient.upsert({
        where: { workshopId_cpf: { workshopId, cpf: client.cpf } },
        create: {
          id: newId,
          workshopId,
          cpf: client.cpf,
          name: client.name,
          phone:
            client.cpf === "11144477735"
              ? "(11) 98765-4321"
              : client.cpf === "52998224725"
                ? "(11) 96543-2109"
                : "",
          completedServices: client.completedServices,
        },
        update: {
          name: client.name,
          completedServices: client.completedServices,
        },
      });
    }
  }

  const sponsorships = [
    { workshopId: "1", tier: "ouro" as const, monthlyValue: 890, notes: "Patrocínio premium" },
    { workshopId: "7", tier: "prata" as const, monthlyValue: 490, notes: "Estética em destaque regional" },
  ];

  for (const s of sponsorships) {
    await prisma.sponsorship.upsert({
      where: { workshopId: s.workshopId },
      create: s,
      update: { tier: s.tier, monthlyValue: s.monthlyValue, notes: s.notes },
    });
  }

  await prisma.siteAnnouncement.upsert({
    where: { id: "ann-seed-1" },
    create: {
      id: "ann-seed-1",
      title: "Encontre oficinas perto de você",
      message: "Compare perfis, avaliações e catálogos — sem criar conta para entrar em contato.",
      placement: "site_geral",
      style: "info",
      active: true,
      createdAt: new Date("2026-06-10T10:00:00.000Z"),
    },
    update: { active: true },
  });

  const workshopId = "1";

  const seedVehicles = [
    { id: "veh-1-civic", clientId: "cli-1-11144477735", plate: "ABC1D23", model: "Honda Civic 2020" },
    { id: "veh-1-corolla", clientId: "cli-1-39053344705", plate: "DEF4G56", model: "Toyota Corolla 2019" },
    { id: "veh-1-gol", clientId: "cli-1-52998224725", plate: "GHI7J89", model: "VW Gol 2018" },
  ];

  for (const v of seedVehicles) {
    await prisma.crmVehicle.upsert({
      where: { workshopId_plate: { workshopId, plate: v.plate } },
      create: { ...v, workshopId },
      update: { model: v.model, clientId: v.clientId },
    });
  }

  const seedFictional = [
    { id: "fic-1-joao", name: "João Silva", specialty: "Suspensão e freios", notes: "Turno manhã" },
    { id: "fic-1-maria", name: "Maria Santos", specialty: "Elétrica automotiva", notes: "Turno tarde" },
  ];

  for (const m of seedFictional) {
    await prisma.fictionalMechanic.upsert({
      where: { id: m.id },
      create: { ...m, workshopId, active: true },
      update: { name: m.name, specialty: m.specialty, notes: m.notes, active: true },
    });
  }

  const seedOrders = [
    {
      id: "OS-001",
      clientId: "cli-1-11144477735",
      clientName: "Carlos Mendes",
      clientCpf: "11144477735",
      vehicle: "Honda Civic 2020",
      vehiclePlate: "ABC1D23",
      service: "Troca de óleo + filtros",
      status: "concluido" as const,
      date: "2026-05-10",
      value: 280,
      mechanicId: "platform-pedro",
      mechanicKind: "platform" as const,
      mechanicName: "Pedro Oliveira",
    },
    {
      id: "OS-002",
      clientId: "cli-1-39053344705",
      clientName: "Ana Paula Ribeiro",
      clientCpf: "39053344705",
      vehicle: "Toyota Corolla 2019",
      vehiclePlate: "DEF4G56",
      service: "Alinhamento e balanceamento",
      status: "em_andamento" as const,
      date: "2026-06-08",
      value: 180,
      mechanicId: "fic-1-joao",
      mechanicKind: "fictional" as const,
      mechanicName: "João Silva",
    },
    {
      id: "OS-003",
      clientId: "cli-1-52998224725",
      clientName: "Roberto Lima",
      clientCpf: "52998224725",
      vehicle: "VW Gol 2018",
      vehiclePlate: "GHI7J89",
      service: "Revisão dos freios",
      status: "pendente" as const,
      date: "2026-06-12",
      value: 420,
      mechanicId: "fic-1-maria",
      mechanicKind: "fictional" as const,
      mechanicName: "Maria Santos",
    },
  ];

  for (const o of seedOrders) {
    await prisma.crmServiceOrder.upsert({
      where: { id: o.id },
      create: { ...o, workshopId },
      update: {
        status: o.status,
        value: o.value,
        mechanicId: o.mechanicId,
        mechanicKind: o.mechanicKind,
        mechanicName: o.mechanicName,
      },
    });
  }

  const seedSuppliers = [
    { id: "sup-1-autopecas", name: "Auto Peças Centro", phone: "(11) 3333-4444", notes: "Entrega rápida" },
    { id: "sup-1-rolamentos", name: "Rolamentos SP", phone: "(11) 3555-6677", notes: "Freios e suspensão" },
  ];

  for (const s of seedSuppliers) {
    await prisma.supplierContact.upsert({
      where: { id: s.id },
      create: { ...s, workshopId },
      update: { name: s.name, phone: s.phone, notes: s.notes },
    });
  }

  const seedAgenda = [
    {
      id: "ag-seed-pendente",
      clientName: "Fernanda Costa",
      clientPhone: "11987654321",
      vehicle: "Hyundai HB20 2022",
      preferredDate: "2026-06-18",
      preferredTime: "10:00",
      service: "Diagnóstico eletrônico",
      status: "pendente" as const,
    },
    {
      id: "ag-seed-aprovado",
      clientName: "João Pedro S.",
      clientPhone: "11976543210",
      vehicle: "Fiat Argo 2021",
      preferredDate: "2026-06-16",
      preferredTime: "14:00",
      service: "Ar-condicionado",
      status: "aprovado" as const,
    },
  ];

  for (const a of seedAgenda) {
    await prisma.agendaRequest.upsert({
      where: { id: a.id },
      create: { ...a, workshopId },
      update: { status: a.status },
    });
  }

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
