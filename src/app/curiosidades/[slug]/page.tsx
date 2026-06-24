import { notFound } from "next/navigation";
import { APP_NAME } from "@/lib/brand";
import { NewspaperArticlePage } from "@/components/news/NewspaperArticlePage";
import { NewspaperCategoryNav, NewspaperMasthead } from "@/components/news/NewspaperMasthead";
import { isValidArticleCategory, type JournalTabId } from "@/lib/article-categories";
import {
  getArticleBySlugOrId,
  getRelatedArticles,
  seedArticlesIfEmpty,
} from "@/lib/db/articles";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  await seedArticlesIfEmpty();
  const { slug } = await params;
  const article = await getArticleBySlugOrId(slug);
  if (!article) return { title: `Notícia — ${APP_NAME}` };
  return {
    title: `${article.title} — Jornal ${APP_NAME}`,
    description: article.summary,
  };
}

export default async function CuriosidadeDetailPage({ params }: Props) {
  await seedArticlesIfEmpty();
  const { slug } = await params;
  const article = await getArticleBySlugOrId(slug);
  if (!article) notFound();

  const related = await getRelatedArticles(article.id, article.category);
  const activeTab: JournalTabId = isValidArticleCategory(article.category)
    ? article.category
    : "inicio";

  return (
    <div className="newspaper-page mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <NewspaperMasthead compact />
      <NewspaperCategoryNav activeTab={activeTab} />
      <NewspaperArticlePage article={article} related={related} />
    </div>
  );
}
