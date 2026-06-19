import { demoEmail } from "@/lib/brand";

export interface PendingWorkshop {
  id: string;
  name: string;
  type: "carros" | "motos" | "mista" | "estetica";
  city: string;
  state: string;
  owner: string;
  email: string;
  submittedAt: string;
  status: "pendente" | "aprovada" | "reprovada" | "suspensa";
}

export interface Subscription {
  id: string;
  workshopName: string;
  plan: "basico" | "profissional" | "enterprise";
  value: number;
  status: "ativa" | "atrasada" | "cancelada" | "suspensa";
  nextDue: string;
}

export interface PlatformAccount {
  id: string;
  name: string;
  email: string;
  role: "dono" | "gerencia" | "mecanico";
  workshop: string;
  active: boolean;
}

export interface SupportTicket {
  id: string;
  workshop: string;
  subject: string;
  priority: "baixa" | "media" | "alta";
  status: "aberto" | "em_andamento" | "resolvido";
  createdAt: string;
}

export const pendingWorkshops: PendingWorkshop[] = [
  {
    id: "p1",
    name: "Oficina Nova Horizonte",
    type: "mista",
    city: "Goiânia",
    state: "GO",
    owner: "Ricardo Almeida",
    email: "ricardo@novahorizonte.com.br",
    submittedAt: "2026-06-14",
    status: "pendente",
  },
  {
    id: "p2",
    name: "Speed Moto Racing",
    type: "motos",
    city: "Florianópolis",
    state: "SC",
    owner: "Lucas Ferreira",
    email: "lucas@speedmoto.com.br",
    submittedAt: "2026-06-13",
    status: "pendente",
  },
  {
    id: "p3",
    name: "Auto Prime SP",
    type: "carros",
    city: "São Paulo",
    state: "SP",
    owner: "Fernanda Lima",
    email: "fernanda@autoprime.com.br",
    submittedAt: "2026-06-10",
    status: "aprovada",
  },
  {
    id: "p4",
    name: "Mecânica do Bairro",
    type: "carros",
    city: "Salvador",
    state: "BA",
    owner: "Antonio Souza",
    email: "antonio@mecanicabairro.com.br",
    submittedAt: "2026-06-05",
    status: "suspensa",
  },
  {
    id: "p5",
    name: "Estética Auto Lux",
    type: "estetica",
    city: "Brasília",
    state: "DF",
    owner: "Camila Rocha",
    email: "camila@autolux.com.br",
    submittedAt: "2026-06-15",
    status: "pendente",
  },
];

export const subscriptions: Subscription[] = [
  { id: "s1", workshopName: "Auto Center Silva", plan: "profissional", value: 299, status: "ativa", nextDue: "2026-07-01" },
  { id: "s2", workshopName: "Moto Tech Pro", plan: "basico", value: 149, status: "ativa", nextDue: "2026-07-05" },
  { id: "s3", workshopName: "Garage Mix Santos", plan: "enterprise", value: 499, status: "ativa", nextDue: "2026-07-10" },
  { id: "s4", workshopName: "Mecânica do Bairro", plan: "basico", value: 149, status: "atrasada", nextDue: "2026-06-01" },
  { id: "s5", workshopName: "Premium Auto BH", plan: "profissional", value: 299, status: "suspensa", nextDue: "2026-05-15" },
];

export const platformAccounts: PlatformAccount[] = [
  { id: "a1", name: "João Silva", email: demoEmail("dono"), role: "dono", workshop: "Auto Center Silva", active: true },
  { id: "a2", name: "Maria Santos", email: demoEmail("gerencia"), role: "gerencia", workshop: "Auto Center Silva", active: true },
  { id: "a3", name: "Pedro Oliveira", email: demoEmail("mecanico"), role: "mecanico", workshop: "Auto Center Silva", active: true },
  { id: "a4", name: "Carlos Mendes", email: "carlos@mototechpro.com.br", role: "dono", workshop: "Moto Tech Pro", active: true },
];

export const supportTickets: SupportTicket[] = [
  { id: "T-001", workshop: "Auto Center Silva", subject: "Dúvida sobre emissão de PDF", priority: "baixa", status: "aberto", createdAt: "2026-06-15" },
  { id: "T-002", workshop: "Garage Mix Santos", subject: "Problema no login de funcionário", priority: "alta", status: "em_andamento", createdAt: "2026-06-14" },
  { id: "T-003", workshop: "Mecânica do Bairro", subject: "Solicitação de reativação", priority: "media", status: "aberto", createdAt: "2026-06-13" },
];

export const plans = [
  {
    id: "basico",
    name: "Básico",
    price: 149,
    features: ["Dashboard operacional", "Até 3 usuários", "Cadastro de clientes", "Orçamentos básicos"],
  },
  {
    id: "profissional",
    name: "Profissional",
    price: 299,
    features: ["Tudo do Básico", "Até 10 usuários", "Financeiro completo", "Estoque", "Relatórios", "WhatsApp"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 499,
    features: ["Tudo do Profissional", "Usuários ilimitados", "Multi-filial", "API", "Suporte prioritário"],
  },
];
