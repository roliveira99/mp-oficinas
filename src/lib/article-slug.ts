export function slugifyTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function articleHref(article: { id: string; slug?: string | null }): string {
  return `/curiosidades/${article.slug || article.id}`;
}

export function formatArticleDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatArticleDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    manutencao: "Manutenção",
    dicas: "Dicas",
    mercado: "Mercado",
    tecnologia: "Tecnologia",
    geral: "Geral",
  };
  return labels[category.toLowerCase()] ?? category.charAt(0).toUpperCase() + category.slice(1);
}
