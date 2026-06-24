import type { BusinessVertical, PlatformTerminology } from "@/types/vertical";
import { getCategoryLabel, getVerticalConfig } from "@/lib/verticals/config";

export const DIRECTORY_PATH = "/negocios";

export function businessProfilePath(slug: string): string {
  return `${DIRECTORY_PATH}/${slug}`;
}

export function directoryUrl(params?: { q?: string; segmento?: BusinessVertical; tipo?: string; categoria?: string }): string {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.segmento) search.set("segmento", params.segmento);
  if (params?.tipo) search.set("tipo", params.tipo);
  if (params?.categoria) search.set("categoria", params.categoria);
  const qs = search.toString();
  return qs ? `${DIRECTORY_PATH}?${qs}` : DIRECTORY_PATH;
}

export function searchUrl(q?: string): string {
  if (!q?.trim()) return "/busca";
  return `/busca?q=${encodeURIComponent(q.trim())}`;
}

export function getPlatformTerminology(): PlatformTerminology {
  return {
    directoryNav: "Negócios",
    directoryPath: DIRECTORY_PATH,
    profilePath: businessProfilePath,
    managerLoginSubtitle: "Gestão profissional para qualquer empreendimento",
    homeFeaturedTitle: "Negócios em destaque",
    homeFeaturedDescription: "Estabelecimentos em vários segmentos — patrocinados aparecem primeiro.",
    homeManagerTitle: "Seu negócio com perfil profissional na plataforma",
    homeManagerDescription:
      "Catálogo, avaliações, agenda e gestão integrada — para oficinas, lojas, salões e muito mais.",
  };
}

export function getBusinessSegmentLabel(workshop: {
  vertical?: BusinessVertical | null;
  category?: string | null;
  type?: string;
}): string {
  const vertical = getVerticalConfig(workshop.vertical);
  if (vertical.usesAutomotiveTypes && workshop.type) {
    const auto = vertical.categories.find((c) => c.value === workshop.type);
    if (auto) return auto.label;
  }
  if (workshop.category) {
    return getCategoryLabel(workshop.vertical ?? "automotive", workshop.category);
  }
  return vertical.name;
}

export function isBusinessProfilePath(pathname: string): boolean {
  return /^\/negocios\/[^/]+$/.test(pathname) || /^\/oficinas\/[^/]+$/.test(pathname);
}
