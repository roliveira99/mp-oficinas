import type { Prisma, UserRole, WorkshopType } from "@prisma/client";
import { hashPassword } from "@/lib/db/auth";
import { prisma } from "@/lib/db/prisma";
import { mapDbWorkshop } from "@/lib/db/mappers";
import { uniqueWorkshopSlug } from "@/lib/slug";
import type { Workshop } from "@/types/workshop";

const emptyCatalog = { services: [] as { id: string; name: string; priceFrom: number }[], parts: [] as { id: string; name: string; priceFrom: number }[] };

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  workshopId: string | null;
  workshopName: string | null;
  createdAt: string;
};

export async function listAdminWorkshops(): Promise<Workshop[]> {
  const rows = await prisma.workshop.findMany({ orderBy: { name: "asc" } });
  return rows.map(mapDbWorkshop);
}

export async function createWorkshop(input: {
  name: string;
  type: WorkshopType;
  description: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  whatsapp?: string;
  email: string;
  openingHours?: string;
  tagline?: string;
  owner?: { name: string; email: string; password: string };
}): Promise<{ ok: true; workshop: Workshop; ownerEmail?: string } | { ok: false; error: string }> {
  const name = input.name?.trim();
  const description = input.description?.trim();
  const address = input.address?.trim();
  const city = input.city?.trim();
  const state = input.state?.trim().toUpperCase();
  const phone = input.phone?.trim();
  const email = input.email?.trim().toLowerCase();

  if (!name || !description || !address || !city || !state || !phone || !email) {
    return { ok: false, error: "Preencha todos os campos obrigatórios da oficina." };
  }

  if (state.length !== 2) {
    return { ok: false, error: "UF deve ter 2 letras (ex.: SP)." };
  }

  if (input.owner) {
    const ownerName = input.owner.name?.trim();
    const ownerEmail = input.owner.email?.toLowerCase().trim();
    const ownerPassword = input.owner.password ?? "";
    if (!ownerName || !ownerEmail || ownerPassword.length < 6) {
      return {
        ok: false,
        error: "Dados do dono incompletos — nome, e-mail e senha (mín. 6 caracteres).",
      };
    }
    const existing = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (existing) return { ok: false, error: "E-mail do dono já está em uso." };
  }

  const slug = await uniqueWorkshopSlug(name, async (s) => {
    const found = await prisma.workshop.findUnique({ where: { slug: s } });
    return !!found;
  });

  const id = `ws-${slug}`;

  try {
    const workshop = await prisma.$transaction(async (tx) => {
      const created = await tx.workshop.create({
        data: {
          id,
          name,
          slug,
          type: input.type,
          description,
          tagline: input.tagline?.trim() || null,
          address,
          city,
          state,
          phone,
          whatsapp: (input.whatsapp ?? phone).trim(),
          email,
          openingHours: input.openingHours?.trim() || "Seg–Sex 8h–18h",
          image: "🔧",
          rating: 0,
          reviewCount: 0,
          services: [] as Prisma.InputJsonValue,
          specialties: [] as Prisma.InputJsonValue,
          paymentMethods: ["PIX", "Dinheiro", "Cartão"] as Prisma.InputJsonValue,
          catalog: emptyCatalog as Prisma.InputJsonValue,
          hasAgenda: true,
        },
      });

      if (input.owner) {
        const ownerEmail = input.owner.email.toLowerCase().trim();
        await tx.user.create({
          data: {
            email: ownerEmail,
            passwordHash: await hashPassword(input.owner.password),
            name: input.owner.name.trim(),
            role: "dono",
            workshopId: created.id,
          },
        });
      }

      return created;
    });

    if (input.owner) {
      return {
        ok: true,
        workshop: mapDbWorkshop(workshop),
        ownerEmail: input.owner.email.toLowerCase().trim(),
      };
    }

    return { ok: true, workshop: mapDbWorkshop(workshop) };
  } catch (err) {
    console.error("[createWorkshop]", err);
    return {
      ok: false,
      error: "Não foi possível salvar a oficina. Verifique os dados e tente novamente.",
    };
  }
}

export async function deleteWorkshop(workshopId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const count = await prisma.workshop.count({ where: { id: workshopId } });
  if (!count) return { ok: false, error: "Oficina não encontrada." };
  await prisma.workshop.delete({ where: { id: workshopId } });
  return { ok: true };
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const rows = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: { workshop: { select: { name: true } } },
  });
  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    workshopId: u.workshopId,
    workshopName: u.workshop?.name ?? null,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function createPlatformUser(input: {
  name: string;
  email: string;
  password: string;
  role: "dono" | "gerencia" | "mecanico";
  workshopId: string;
}): Promise<{ ok: true; user: AdminUserRow } | { ok: false; error: string }> {
  const email = input.email.toLowerCase().trim();
  if (!email || input.password.length < 6) {
    return { ok: false, error: "E-mail válido e senha com no mínimo 6 caracteres." };
  }

  const workshop = await prisma.workshop.findUnique({ where: { id: input.workshopId } });
  if (!workshop) return { ok: false, error: "Oficina não encontrada." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "Este e-mail já possui conta." };

  if (input.role === "dono") {
    const owner = await prisma.user.findFirst({
      where: { workshopId: input.workshopId, role: "dono" },
    });
    if (owner) return { ok: false, error: "Esta oficina já possui um dono cadastrado." };
  }

  const row = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(input.password),
      name: input.name.trim(),
      role: input.role,
      workshopId: input.workshopId,
    },
    include: { workshop: { select: { name: true } } },
  });

  return {
    ok: true,
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      workshopId: row.workshopId,
      workshopName: row.workshop?.name ?? null,
      createdAt: row.createdAt.toISOString(),
    },
  };
}

export async function deletePlatformUser(
  userId: string,
  adminEmail: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "Usuário não encontrado." };
  if (user.role === "master") return { ok: false, error: "Não é possível remover o administrador master." };
  if (user.email === adminEmail) return { ok: false, error: "Não é possível remover sua própria conta." };
  await prisma.user.delete({ where: { id: userId } });
  return { ok: true };
}
