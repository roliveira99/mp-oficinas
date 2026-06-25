import { notFound } from "next/navigation";
import { APP_NAME } from "@/lib/brand";
import { NewspaperCategoryPage } from "@/components/news/NewspaperCategoryPage";
import { NewspaperCategoryNav, NewspaperMasthead } from "@/components/news/NewspaperMasthead";
import {
  getCategoryDef,
  isValidArticleCategory,
  type JournalTabId,
} from "@/lib/article-categories";
import { listArticles, seedArticlesIfEmpty } from "@/lib/db/articles";

type Props = { params: Promise<{ categoria: string }> };

export async function generateStaticParams() {
  const { ARTICLE_CATEGORIES } = await import("@/lib/article-categories");
  return ARTICLE_CATEGORIES.map((c) => ({ categoria: c.value }));
}

export async function generateMetadata({ params }: Props) {
  const { categoria } = await params;
  const def = getCategoryDef(categoria);
  if (!def) return { title: `Jornal — ${APP_NAME}` };
  return {
    title: `${def.label} — Jornal ${APP_NAME}`,
    description: def.description,
  };
}

export default async function JournalCategoryPage({ params }: Props) {
  const { categoria } = await params;
  if (!isValidArticleCategory(categoria)) notFound();

  const def = getCategoryDef(categoria)!;
  await seedArticlesIfEmpty();
  const articles = await listArticles({ activeOnly: true, category: categoria });

  return (
    <div className="news-feed-page newspaper-page mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <NewspaperMasthead />
      <NewspaperCategoryNav activeTab={categoria as JournalTabId} />
      <NewspaperCategoryPage category={def} articles={articles} />
    </div>
  );
}
