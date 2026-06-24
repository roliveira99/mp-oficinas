import type { BusinessVertical } from "@/types/vertical";
import type { NavItem, Permission, UserRole } from "@/types/auth";
import { getOperationalConfig } from "@/lib/verticals/operational";

export const roleLabels: Record<UserRole, string> = {
  master: "Administrador Master",
  dono: "Dono da Oficina",
  gerencia: "Gerência",
  mecanico: "Mecânico",
};

export const roleIcons: Record<UserRole, string> = {
  master: "users",
  dono: "building",
  gerencia: "clipboard",
  mecanico: "wrench",
};

const masterPermissions: Permission[] = [
  "admin.aprovar_oficinas",
  "admin.criar_contas",
  "admin.visualizar_oficinas",
  "admin.relatorios_globais",
  "admin.dashboard_geral",
  "admin.controle_assinaturas",
  "admin.bloquear_oficinas",
  "admin.suporte",
  "admin.moderar_avaliacoes",
  "admin.gerenciar_patrocinios",
  "admin.gerenciar_anuncios",
];

const donoPermissions: Permission[] = [
  "owner.dashboard",
  "owner.fluxo_caixa",
  "owner.contas_pagar",
  "owner.contas_receber",
  "owner.estoque",
  "owner.cadastro_pecas",
  "owner.cadastro_servicos",
  "owner.cadastro_clientes",
  "owner.cadastro_veiculos",
  "owner.cadastro_funcionarios",
  "owner.mecanicos_ficticios",
  "owner.criar_orcamento",
  "owner.configurar_notas",
  "owner.salarios",
  "owner.comissoes",
  "owner.ponto",
  "owner.aprovar_orcamentos",
  "owner.aprovar_alteracoes",
  "owner.emissao_pdf",
  "owner.envio_whatsapp",
  "owner.relatorios_financeiros",
  "owner.relatorios_operacionais",
  "owner.relatorios_produtividade",
];

const gerenciaPermissions: Permission[] = [
  "gerencia.dashboard",
  "gerencia.aprovar_orcamentos",
  "gerencia.alterar_orcamentos",
  "gerencia.cadastro_clientes",
  "gerencia.cadastro_veiculos",
  "gerencia.estoque",
  "gerencia.entrada_pecas",
  "gerencia.saida_pecas",
  "gerencia.emissao_notas",
  "gerencia.emissao_pdf",
  "gerencia.envio_whatsapp",
  "gerencia.relatorios_operacionais",
  "gerencia.agenda",
  "gerencia.controle_servicos",
  "gerencia.mecanicos_ficticios",
  "gerencia.criar_orcamento",
];

const mecanicoPermissions: Permission[] = [
  "mecanico.criar_orcamento",
  "mecanico.registrar_servicos",
  "mecanico.registrar_pecas",
  "mecanico.historico_proprio",
  "mecanico.consultar_comissoes",
  "mecanico.consultar_produtividade",
  "mecanico.solicitar_alteracao",
  "mecanico.registrar_fotos",
  "mecanico.atualizar_status",
  "mecanico.fornecedores",
];

export const rolePermissions: Record<UserRole, Permission[]> = {
  master: masterPermissions,
  dono: donoPermissions,
  gerencia: gerenciaPermissions,
  mecanico: mecanicoPermissions,
};

export const roleRestrictions: Record<UserRole, string[]> = {
  master: ["Alterar dados operacionais sem permissão da oficina"],
  dono: ["Alterar configurações globais da plataforma"],
  gerencia: [
    "Não visualiza salários",
    "Não altera plano contratado",
    "Não gerencia assinatura",
  ],
  mecanico: [
    "Não aprova orçamento",
    "Não altera estoque",
    "Não altera valores de tabela",
    "Não visualiza dados financeiros da empresa",
    "Não visualiza salários de outros funcionários",
  ],
};

export const navigationByRole: Record<UserRole, NavItem[]> = {
  master: [
    { href: "/dashboard", label: "Dashboard geral", icon: "dashboard", permission: "admin.dashboard_geral" },
    { href: "/dashboard/admin/oficinas", label: "Oficinas", icon: "building", permission: "admin.visualizar_oficinas", group: "Gestão" },
    { href: "/dashboard/admin/patrocinios", label: "Patrocínios", icon: "star", permission: "admin.gerenciar_patrocinios", group: "Gestão" },
    { href: "/dashboard/admin/avaliacoes", label: "Moderação", icon: "clipboard", permission: "admin.moderar_avaliacoes", group: "Conteúdo" },
    { href: "/dashboard/admin/anuncios", label: "Conteúdo do site", icon: "sparkles", permission: "admin.gerenciar_anuncios", group: "Conteúdo" },
    { href: "/dashboard/admin/contas", label: "Contas e acessos", icon: "users", permission: "admin.criar_contas", group: "Gestão" },
    { href: "/dashboard/admin/assinaturas", label: "Assinaturas", icon: "credit-card", permission: "admin.controle_assinaturas", group: "Financeiro" },
    { href: "/dashboard/admin/relatorios", label: "Relatórios globais", icon: "chart", permission: "admin.relatorios_globais", group: "Relatórios" },
    { href: "/dashboard/admin/suporte", label: "Suporte", icon: "headset", permission: "admin.suporte", group: "Suporte" },
  ],
  dono: [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard", permission: "owner.dashboard" },
    { href: "/dashboard/financeiro", label: "Financeiro", icon: "wallet", permission: "owner.fluxo_caixa", group: "Financeiro" },
    { href: "/dashboard/orcamentos", label: "Orçamentos", icon: "file", permission: "owner.aprovar_orcamentos", group: "Operacional" },
    { href: "/dashboard/notas-servico", label: "Notas de serviço", icon: "file", permission: "owner.emissao_pdf", group: "Operacional" },
    { href: "/dashboard/estoque", label: "Estoque", icon: "box", permission: "owner.estoque", group: "Operacional" },
    { href: "/dashboard/servicos", label: "Serviços", icon: "wrench", permission: "owner.cadastro_servicos", group: "Operacional" },
    { href: "/dashboard/cadastros", label: "Cadastros", icon: "clipboard", permission: "owner.cadastro_clientes", group: "Cadastros" },
    { href: "/dashboard/catalogo", label: "Catálogo público", icon: "package", permission: "owner.cadastro_servicos", group: "Cadastros" },
    { href: "/dashboard/perfil", label: "Perfil da oficina", icon: "sparkles", permission: "owner.cadastro_servicos", group: "Cadastros" },
    { href: "/dashboard/classificados", label: "Classificados", icon: "package", permission: "owner.cadastro_servicos", group: "Cadastros" },
    { href: "/dashboard/equipe-ficticia", label: "Equipe sem acesso", icon: "user-group", permission: "owner.mecanicos_ficticios", group: "RH" },
    { href: "/dashboard/rh", label: "RH", icon: "user-group", permission: "owner.salarios", group: "RH" },
    { href: "/dashboard/relatorios", label: "Relatórios", icon: "chart", permission: "owner.relatorios_financeiros", group: "Relatórios" },
  ],
  gerencia: [
    { href: "/dashboard", label: "Dashboard operacional", icon: "dashboard", permission: "gerencia.dashboard" },
    { href: "/dashboard/orcamentos", label: "Orçamentos", icon: "file", permission: "gerencia.aprovar_orcamentos", group: "Operacional" },
    { href: "/dashboard/notas-servico", label: "Notas de serviço", icon: "file", permission: "gerencia.emissao_notas", group: "Operacional" },
    { href: "/dashboard/estoque", label: "Estoque", icon: "box", permission: "gerencia.estoque", group: "Operacional" },
    { href: "/dashboard/servicos", label: "Serviços", icon: "wrench", permission: "gerencia.controle_servicos", group: "Operacional" },
    { href: "/dashboard/cadastros", label: "Veículos e clientes", icon: "car", permission: "gerencia.cadastro_clientes", group: "Cadastros" },
    { href: "/dashboard/agenda", label: "Agenda", icon: "calendar", permission: "gerencia.agenda", group: "Operacional" },
    { href: "/dashboard/equipe-ficticia", label: "Equipe sem acesso", icon: "user-group", permission: "gerencia.mecanicos_ficticios", group: "Equipe" },
    { href: "/dashboard/relatorios", label: "Relatórios", icon: "chart", permission: "gerencia.relatorios_operacionais", group: "Relatórios" },
  ],
  mecanico: [
    { href: "/dashboard", label: "Meu painel", icon: "wrench", permission: "mecanico.registrar_servicos" },
    { href: "/dashboard/mecanico/orcamentos", label: "Orçamentos", icon: "clipboard", permission: "mecanico.criar_orcamento", group: "Serviços" },
    { href: "/dashboard/mecanico/servicos", label: "Meus serviços", icon: "wrench", permission: "mecanico.historico_proprio", group: "Serviços" },
    { href: "/dashboard/mecanico/fornecedores", label: "Fornecedores", icon: "users", permission: "mecanico.fornecedores", group: "Contatos" },
    { href: "/dashboard/mecanico/comissoes", label: "Comissões", icon: "wallet", permission: "mecanico.consultar_comissoes", group: "Desempenho" },
    { href: "/dashboard/mecanico/produtividade", label: "Produtividade", icon: "chart", permission: "mecanico.consultar_produtividade", group: "Desempenho" },
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function getRoleLabel(role: UserRole, vertical?: BusinessVertical | null): string {
  if (role === "mecanico") {
    return getOperationalConfig(vertical).roles.operator;
  }
  return roleLabels[role];
}

function applyVerticalNavLabels(items: NavItem[], vertical?: BusinessVertical | null): NavItem[] {
  const ops = getOperationalConfig(vertical);
  return items.map((item) => {
    if (item.href === "/dashboard/cadastros" && item.label.includes("Veículos")) {
      return { ...item, label: ops.assets.tabLabel };
    }
    if (item.href === "/dashboard/equipe-ficticia") {
      return { ...item, label: ops.roles.teamWithoutLogin };
    }
    if (item.href === "/dashboard/mecanico/orcamentos" || item.href.startsWith("/dashboard/mecanico")) {
      if (item.label === "Meu painel") {
        return { ...item, label: `Meu painel (${ops.roles.operator})` };
      }
    }
    if (item.href === "/dashboard/estoque" && ops.catalog.partsLabel !== "Peças") {
      return item;
    }
    return item;
  });
}

export function getNavItems(role: UserRole, vertical?: BusinessVertical | null): NavItem[] {
  const items = navigationByRole[role] ?? [];
  if (role === "gerencia") {
    const ops = getOperationalConfig(vertical);
    return applyVerticalNavLabels(
      items.map((item) =>
        item.href === "/dashboard/cadastros"
          ? { ...item, label: `${ops.assets.pluralLabel} e clientes` }
          : item
      ),
      vertical
    );
  }
  if (role === "dono" || role === "mecanico") {
    return applyVerticalNavLabels(items, vertical);
  }
  return items;
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const items = navigationByRole[role];
  if (pathname === "/dashboard") {
    return items.some((i) => i.href === "/dashboard");
  }
  return items.some(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`)
  );
}
