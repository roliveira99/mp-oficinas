import type { BusinessVertical } from "@/types/vertical";

export type BusinessAssetType = "vehicle" | "generic" | "pet" | "property" | "order";

export interface AssetFieldConfig {
  key: "referenceKey" | "label" | "model" | "year";
  label: string;
  required: boolean;
  placeholder: string;
}

export interface OperationalConfig {
  assets: {
    enabled: boolean;
    requiredForBudget: boolean;
    type: BusinessAssetType;
    pluralLabel: string;
    singularLabel: string;
    tabLabel: string;
    fields: AssetFieldConfig[];
  };
  roles: {
    operator: string;
    operatorPlural: string;
    teamWithoutLogin: string;
  };
  catalog: {
    partsLabel: string;
    servicesLabel: string;
  };
  reviews: {
    requireAssetReference: boolean;
    assetReferenceLabel: string;
  };
}

const automotiveOperational: OperationalConfig = {
  assets: {
    enabled: true,
    requiredForBudget: true,
    type: "vehicle",
    pluralLabel: "Veículos",
    singularLabel: "Veículo",
    tabLabel: "Veículos",
    fields: [
      { key: "referenceKey", label: "Placa", required: true, placeholder: "ABC1D23" },
      { key: "label", label: "Modelo", required: true, placeholder: "Honda Civic 2020" },
      { key: "year", label: "Ano", required: false, placeholder: "2020" },
    ],
  },
  roles: { operator: "Mecânico", operatorPlural: "Mecânicos", teamWithoutLogin: "Equipe sem acesso" },
  catalog: { partsLabel: "Peças", servicesLabel: "Serviços" },
  reviews: { requireAssetReference: true, assetReferenceLabel: "Placa do veículo" },
};

const genericOperational = (overrides: Partial<OperationalConfig>): OperationalConfig => ({
  assets: {
    enabled: true,
    requiredForBudget: false,
    type: "generic",
    pluralLabel: "Referências",
    singularLabel: "Referência",
    tabLabel: "Referências / pedidos",
    fields: [
      { key: "referenceKey", label: "Código / referência", required: true, placeholder: "PED-001, Mesa 12…" },
      { key: "label", label: "Descrição", required: true, placeholder: "Pedido, item ou local" },
    ],
  },
  roles: { operator: "Operador", operatorPlural: "Operadores", teamWithoutLogin: "Equipe sem login" },
  catalog: { partsLabel: "Produtos", servicesLabel: "Serviços" },
  reviews: { requireAssetReference: false, assetReferenceLabel: "Referência" },
  ...overrides,
});

export const OPERATIONAL_BY_VERTICAL: Record<BusinessVertical, OperationalConfig> = {
  automotive: automotiveOperational,
  beauty: genericOperational({
    assets: {
      enabled: true,
      requiredForBudget: false,
      type: "generic",
      pluralLabel: "Clientes / fichas",
      singularLabel: "Ficha",
      tabLabel: "Fichas de atendimento",
      fields: [
        { key: "referenceKey", label: "Referência", required: true, placeholder: "Ficha ou comanda" },
        { key: "label", label: "Cliente / serviço", required: true, placeholder: "Nome ou procedimento" },
      ],
    },
    roles: { operator: "Profissional", operatorPlural: "Profissionais", teamWithoutLogin: "Equipe sem login" },
    catalog: { partsLabel: "Produtos", servicesLabel: "Procedimentos" },
    reviews: { requireAssetReference: false, assetReferenceLabel: "Referência" },
  }),
  food: genericOperational({
    catalog: { partsLabel: "Insumos", servicesLabel: "Itens do cardápio" },
    roles: { operator: "Atendente", operatorPlural: "Atendentes", teamWithoutLogin: "Equipe sem login" },
  }),
  retail: genericOperational({
    catalog: { partsLabel: "Produtos", servicesLabel: "Serviços" },
    roles: { operator: "Vendedor", operatorPlural: "Vendedores", teamWithoutLogin: "Equipe sem login" },
  }),
  health: genericOperational({
    assets: {
      enabled: true,
      requiredForBudget: false,
      type: "generic",
      pluralLabel: "Pacientes / prontuários",
      singularLabel: "Prontuário",
      tabLabel: "Prontuários",
      fields: [
        { key: "referenceKey", label: "Nº prontuário", required: true, placeholder: "PR-1024" },
        { key: "label", label: "Paciente", required: true, placeholder: "Nome do paciente" },
      ],
    },
    roles: { operator: "Profissional", operatorPlural: "Profissionais", teamWithoutLogin: "Equipe sem login" },
    catalog: { partsLabel: "Materiais", servicesLabel: "Procedimentos" },
  }),
  services: genericOperational({
    assets: {
      enabled: true,
      requiredForBudget: false,
      type: "property",
      pluralLabel: "Locais / chamados",
      singularLabel: "Chamado",
      tabLabel: "Locais e chamados",
      fields: [
        { key: "referenceKey", label: "Referência", required: true, placeholder: "Endereço ou OS" },
        { key: "label", label: "Descrição", required: true, placeholder: "Tipo de serviço ou local" },
      ],
    },
    roles: { operator: "Técnico", operatorPlural: "Técnicos", teamWithoutLogin: "Equipe sem login" },
  }),
  education: genericOperational({
    catalog: { partsLabel: "Materiais", servicesLabel: "Cursos / turmas" },
    roles: { operator: "Instrutor", operatorPlural: "Instrutores", teamWithoutLogin: "Equipe sem login" },
  }),
  pets: genericOperational({
    assets: {
      enabled: true,
      requiredForBudget: false,
      type: "pet",
      pluralLabel: "Pets",
      singularLabel: "Pet",
      tabLabel: "Pets",
      fields: [
        { key: "referenceKey", label: "Identificação", required: true, placeholder: "Nome ou chip" },
        { key: "label", label: "Espécie / raça", required: true, placeholder: "Golden, SRD…" },
      ],
    },
    roles: { operator: "Profissional", operatorPlural: "Profissionais", teamWithoutLogin: "Equipe sem login" },
    catalog: { partsLabel: "Produtos", servicesLabel: "Serviços" },
  }),
  other: genericOperational({}),
};

export function getOperationalConfig(vertical: BusinessVertical | null | undefined): OperationalConfig {
  return OPERATIONAL_BY_VERTICAL[vertical ?? "automotive"] ?? OPERATIONAL_BY_VERTICAL.other;
}

export function formatAssetLabel(asset: {
  label: string;
  referenceKey?: string;
  plate?: string;
  model?: string;
}): string {
  const ref = asset.referenceKey || asset.plate;
  const name = asset.label || asset.model;
  if (ref && name && ref !== name) return `${name} (${ref})`;
  return name || ref || "—";
}
