import Link from "next/link";
import { articleHref, formatCategoryLabel } from "@/lib/article-slug";
import type { Curiosity } from "@/data/curiosities";

interface CuriosityCardProps {
  curiosity: Curiosity & { slug?: string | null };
  expanded?: boolean;
}

export function CuriosityCard({ curiosity, expanded = false }: CuriosityCardProps) {
  const href = articleHref(curiosity);

  return (
    <article className="card flex h-full flex-col p-6 transition hover:shadow-md">
      <Link href={href} className="flex h-full flex-col">
        <span className="mb-3 inline-flex w-fit rounded-md bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
          {formatCategoryLabel(curiosity.category)}
        </span>
        <h3 className="text-lg font-semibold leading-snug text-foreground transition hover:text-accent">
          {curiosity.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
          {curiosity.summary}
        </p>
        {!expanded && (
          <span className="mt-4 text-sm font-medium text-accent">Ler matéria →</span>
        )}
      </Link>
      {expanded && (
        <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
          {curiosity.content}
        </p>
      )}
    </article>
  );
}
