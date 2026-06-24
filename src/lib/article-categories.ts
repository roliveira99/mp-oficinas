export interface ArticleCategoryDef {
  value: string;
  label: string;
  description: string;
}

/** Seções editoriais do jornal — usadas no site e no painel admin. */
export const ARTICLE_CATEGORIES: ArticleCategoryDef[] = [
  { value: "cidade", label: "Cidade", description: "Notícias locais e acontecimentos urbanos" },
  { value: "esporte", label: "Esporte", description: "Resultados, times e eventos esportivos" },
  { value: "negocios", label: "Negócios", description: "Economia, comércio e empreendedorismo" },
  { value: "cultura", label: "Cultura", description: "Eventos, arte e lazer" },
  { value: "tecnologia", label: "Tecnologia", description: "Inovação e tendências digitais" },
  { value: "servicos", label: "Serviços", description: "Dicas para consumidores e manutenção" },
  { value: "geral", label: "Geral", description: "Outras notícias e avisos" },
];

export function getCategoryLabel(value: string): string {
  return ARTICLE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function getCategoryDef(value: string): ArticleCategoryDef | undefined {
  return ARTICLE_CATEGORIES.find((c) => c.value === value);
}

export function isValidArticleCategory(value: string): boolean {
  return ARTICLE_CATEGORIES.some((c) => c.value === value);
}

export type JournalTabId = "inicio" | "classificados" | (typeof ARTICLE_CATEGORIES)[number]["value"];

export const JOURNAL_HOME_HREF = "/curiosidades";
export const JOURNAL_CLASSIFIEDS_HREF = "/curiosidades/classificados";

export function journalCategoryHref(category: string): string {
  return `/curiosidades/editoria/${category}`;
}

export function journalTabHref(tab: JournalTabId): string {
  if (tab === "inicio") return JOURNAL_HOME_HREF;
  if (tab === "classificados") return JOURNAL_CLASSIFIEDS_HREF;
  return journalCategoryHref(tab);
}

/** Colunas exibidas na home do jornal (ordem editorial). */
export const HOME_JOURNAL_COLUMNS = ["cidade", "esporte", "negocios"] as const;
