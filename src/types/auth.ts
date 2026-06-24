export type UserRole = "master" | "jornalista" | "dono" | "gerencia" | "mecanico";

export type Permission =
  | "admin.aprovar_oficinas"
  | "admin.criar_contas"
  | "admin.visualizar_oficinas"
  | "admin.relatorios_globais"
  | "admin.dashboard_geral"
  | "admin.controle_assinaturas"
  | "admin.bloquear_oficinas"
  | "admin.suporte"
  | "admin.moderar_avaliacoes"
  | "admin.gerenciar_patrocinios"
  | "admin.gerenciar_anuncios"
  | "admin.gerenciar_jornalistas"
  | "jornalista.gerenciar_manchetes"
  | "owner.dashboard"
  | "owner.fluxo_caixa"
  | "owner.contas_pagar"
  | "owner.contas_receber"
  | "owner.estoque"
  | "owner.cadastro_pecas"
  | "owner.cadastro_servicos"
  | "owner.cadastro_clientes"
  | "owner.cadastro_veiculos"
  | "owner.cadastro_funcionarios"
  | "owner.mecanicos_ficticios"
  | "owner.criar_orcamento"
  | "owner.configurar_notas"
  | "owner.salarios"
  | "owner.comissoes"
  | "owner.ponto"
  | "owner.aprovar_orcamentos"
  | "owner.aprovar_alteracoes"
  | "owner.emissao_pdf"
  | "owner.envio_whatsapp"
  | "owner.relatorios_financeiros"
  | "owner.relatorios_operacionais"
  | "owner.relatorios_produtividade"
  | "owner.agenda"
  | "gerencia.dashboard"
  | "gerencia.aprovar_orcamentos"
  | "gerencia.alterar_orcamentos"
  | "gerencia.cadastro_clientes"
  | "gerencia.cadastro_veiculos"
  | "gerencia.estoque"
  | "gerencia.entrada_pecas"
  | "gerencia.saida_pecas"
  | "gerencia.emissao_notas"
  | "gerencia.emissao_pdf"
  | "gerencia.envio_whatsapp"
  | "gerencia.relatorios_operacionais"
  | "gerencia.agenda"
  | "gerencia.controle_servicos"
  | "gerencia.mecanicos_ficticios"
  | "gerencia.criar_orcamento"
  | "mecanico.criar_orcamento"
  | "mecanico.registrar_servicos"
  | "mecanico.registrar_pecas"
  | "mecanico.historico_proprio"
  | "mecanico.consultar_comissoes"
  | "mecanico.consultar_produtividade"
  | "mecanico.solicitar_alteracao"
  | "mecanico.registrar_fotos"
  | "mecanico.atualizar_status"
  | "mecanico.fornecedores";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  workshopId: string | null;
  workshopName: string | null;
  workshopVertical?: import("@/types/vertical").BusinessVertical | null;
  journalNiche?: string | null;
}

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  permission: Permission;
  group?: string;
}
