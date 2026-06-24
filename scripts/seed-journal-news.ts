/**
 * Popula o jornal com matérias fictícias inspiradas em notícias reais.
 * Idempotente: não duplica artigos com o mesmo título.
 *
 * Uso: npm run db:seed-journal
 */
import { JOURNAL_DEMO_ARTICLES, JOURNAL_DEMO_CLASSIFIEDS } from "./journal-demo-content";
import { upsertArticle } from "../src/lib/db/articles";
import { createClassified } from "../src/lib/db/classifieds";
import { prisma } from "../src/lib/db/prisma";

async function seedArticles() {
  let created = 0;
  let skipped = 0;
  let featuredSet = false;

  for (const sample of JOURNAL_DEMO_ARTICLES) {
    const existing = await prisma.siteArticle.findFirst({
      where: { title: sample.title },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    const featured = sample.featured && !featuredSet ? true : false;
    if (featured) featuredSet = true;

    await upsertArticle({
      title: sample.title,
      summary: sample.summary,
      content: sample.content,
      category: sample.category,
      city: sample.city ?? null,
      imageUrl: sample.imageUrl ?? null,
      featured,
      active: true,
    });
    created += 1;
  }

  return { created, skipped };
}

async function seedClassifieds() {
  let created = 0;
  let skipped = 0;

  for (const ad of JOURNAL_DEMO_CLASSIFIEDS) {
    const existing = await prisma.classifiedAd.findFirst({
      where: { title: ad.title },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    await createClassified({
      title: ad.title,
      body: ad.body,
      price: ad.price,
      contact: ad.contact,
      category: ad.category,
      images: ad.imageUrl ? [ad.imageUrl] : [],
      premium: ad.premium,
    });
    created += 1;
  }

  return { created, skipped };
}

async function main() {
  console.log("📰 Populando jornal com matérias inspiradas em notícias reais...\n");

  const articles = await seedArticles();
  console.log(`   Artigos: ${articles.created} criados, ${articles.skipped} já existiam`);

  const classifieds = await seedClassifieds();
  console.log(`   Classificados premium: ${classifieds.created} criados, ${classifieds.skipped} já existiam`);

  const totals = await Promise.all([
    prisma.siteArticle.count({ where: { active: true } }),
    prisma.classifiedAd.count({ where: { active: true, premium: true } }),
  ]);

  console.log(`\n✅ Total no jornal: ${totals[0]} matérias ativas, ${totals[1]} classificados premium.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
