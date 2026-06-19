import { APP_NAME } from "@/lib/brand";
import Link from "next/link";
import { CuriosityCard } from "@/components/curiosities/CuriosityCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { listArticles, seedArticlesIfEmpty } from "@/lib/db/articles";

export const metadata = {
  title: `Notícias — ${APP_NAME}`,
  description: "Notícias e avisos relevantes sobre o setor automotivo.",
};

export default async function CuriosidadesPage() {
  await seedArticlesIfEmpty();
  const articles = await listArticles(true);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Notícias relevantes"
        title={`Jornal ${APP_NAME}`}
        description="Conteúdos e avisos publicados pela equipe da plataforma"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {articles.map((a) => (
          <CuriosityCard
            key={a.id}
            curiosity={{ id: a.id, title: a.title, summary: a.summary, content: a.content, category: a.category, icon: a.icon }}
            expanded
          />
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-muted">
        <Link href="/classificados" className="font-medium text-accent hover:underline">
          Ver classificados de vendas
        </Link>
      </p>
    </div>
  );
}
