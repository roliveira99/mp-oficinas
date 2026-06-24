import { slugifyTitle } from "@/lib/article-slug";
import { prisma } from "@/lib/db/prisma";

export interface SiteArticleRecord {
  id: string;
  slug: string | null;
  title: string;
  summary: string;
  content: string;
  category: string;
  icon: string;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base || "noticia";
  let n = 0;
  while (true) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const existing = await prisma.siteArticle.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    n += 1;
  }
}

export async function listArticles(activeOnly = true): Promise<SiteArticleRecord[]> {
  const rows = await prisma.siteArticle.findMany({
    where: activeOnly ? { active: true } : {},
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapArticle);
}

export async function getArticleBySlugOrId(slugOrId: string): Promise<SiteArticleRecord | null> {
  const row =
    (await prisma.siteArticle.findFirst({
      where: { slug: slugOrId, active: true },
    })) ??
    (await prisma.siteArticle.findFirst({
      where: { id: slugOrId, active: true },
    }));
  return row ? mapArticle(row) : null;
}

export async function getRelatedArticles(
  articleId: string,
  category: string,
  limit = 4
): Promise<SiteArticleRecord[]> {
  const rows = await prisma.siteArticle.findMany({
    where: { active: true, id: { not: articleId }, category },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapArticle);
}

export async function upsertArticle(input: {
  id?: string;
  title: string;
  summary: string;
  content: string;
  category?: string;
  icon?: string;
  imageUrl?: string;
  active?: boolean;
  slug?: string;
}): Promise<SiteArticleRecord> {
  const baseSlug = slugifyTitle(input.slug ?? input.title);
  if (input.id) {
    const row = await prisma.siteArticle.update({
      where: { id: input.id },
      data: {
        title: input.title.trim(),
        summary: input.summary.trim(),
        content: input.content.trim(),
        category: input.category?.trim() || "geral",
        icon: input.icon?.trim() || "car",
        imageUrl: input.imageUrl?.trim() || null,
        slug: await uniqueSlug(baseSlug, input.id),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });
    return mapArticle(row);
  }
  const row = await prisma.siteArticle.create({
    data: {
      title: input.title.trim(),
      summary: input.summary.trim(),
      content: input.content.trim(),
      category: input.category?.trim() || "geral",
      icon: input.icon?.trim() || "car",
      imageUrl: input.imageUrl?.trim() || null,
      slug: await uniqueSlug(baseSlug),
      active: input.active ?? true,
    },
  });
  return mapArticle(row);
}

export async function deleteArticle(id: string): Promise<void> {
  await prisma.siteArticle.deleteMany({ where: { id } });
}

function mapArticle(row: {
  id: string;
  slug: string | null;
  title: string;
  summary: string;
  content: string;
  category: string;
  icon: string;
  imageUrl: string | null;
  active: boolean;
  createdAt: Date;
}): SiteArticleRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    category: row.category,
    icon: row.icon,
    imageUrl: row.imageUrl,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function backfillArticleSlugs(): Promise<number> {
  const rows = await prisma.siteArticle.findMany({ where: { slug: null } });
  let updated = 0;
  for (const row of rows) {
    await prisma.siteArticle.update({
      where: { id: row.id },
      data: { slug: await uniqueSlug(slugifyTitle(row.title), row.id) },
    });
    updated += 1;
  }
  return updated;
}

export async function seedArticlesIfEmpty(): Promise<void> {
  await backfillArticleSlugs();
  const count = await prisma.siteArticle.count();
  if (count > 0) return;
  const samples = [
    {
      title: "Quando trocar o óleo do motor?",
      summary: "Intervalos recomendados e sinais de que está na hora da revisão.",
      content:
        "A troca periódica do óleo protege o motor contra desgaste prematuro. Consulte o manual do veículo e registre a quilometragem a cada revisão.\n\n" +
        "Óleo degradado perde viscosidade e deixa de lubrificar corretamente as peças móveis. Além disso, impurezas acumuladas podem obstruir canais internos e reduzir a vida útil do motor.\n\n" +
        "Na dúvida, prefira oficinas que documentam cada serviço e informam o próximo intervalo recomendado.",
      category: "manutencao",
      icon: "wrench",
    },
    {
      title: "Como escolher uma oficina de confiança",
      summary: "Avaliações, transparência de preços e histórico de serviços.",
      content:
        "Prefira estabelecimentos com perfil completo, avaliações verificadas e orçamento detalhado antes do serviço.\n\n" +
        "Transparência no orçamento, garantia por escrito e histórico de atendimentos são sinais claros de profissionalismo. Compare opções no diretório antes de fechar.",
      category: "dicas",
      icon: "star",
    },
    {
      title: "Diagnóstico eletrônico: o que muda na revisão",
      summary: "Scanners OBD ajudam a identificar falhas antes que virem prejuízo.",
      content:
        "Veículos modernos dependem de dezenas de sensores. O diagnóstico eletrônico lê códigos de falha e orienta reparos com precisão, evitando trocas desnecessárias de peças.",
      category: "tecnologia",
      icon: "car",
    },
    {
      title: "Alinhamento e balanceamento: quando fazer",
      summary: "Entenda a diferença e evite desgaste irregular dos pneus.",
      content:
        "Alinhamento corrige os ângulos das rodas; balanceamento elimina vibrações. Faça após trocar pneus, bater em buracos ou notar puxamento no volante.",
      category: "manutencao",
      icon: "wrench",
    },
  ];
  for (const s of samples) {
    await upsertArticle(s);
  }
}
