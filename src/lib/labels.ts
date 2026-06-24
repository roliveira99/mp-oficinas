export const workshopTypeLabels: Record<import("@/types/workshop").WorkshopType, string> = {
  carros: "Carros",
  motos: "Motos",
  mista: "Carros e Motos",
  estetica: "Estética automotiva",
};

export const workshopTypeColors: Record<import("@/types/workshop").WorkshopType, string> = {
  carros:
    "bg-blue-50 text-blue-700 border-blue-200 [data-theme=dark]:bg-blue-950/40 [data-theme=dark]:text-blue-300 [data-theme=dark]:border-blue-800",
  motos:
    "bg-amber-50 text-amber-800 border-amber-200 [data-theme=dark]:bg-amber-950/40 [data-theme=dark]:text-amber-300 [data-theme=dark]:border-amber-800",
  mista:
    "bg-emerald-50 text-emerald-800 border-emerald-200 [data-theme=dark]:bg-emerald-950/40 [data-theme=dark]:text-emerald-300 [data-theme=dark]:border-emerald-800",
  estetica:
    "bg-violet-50 text-violet-800 border-violet-200 [data-theme=dark]:bg-violet-950/40 [data-theme=dark]:text-violet-300 [data-theme=dark]:border-violet-800",
};

export const orderStatusLabels = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
} as const;

export const orderStatusColors = {
  pendente: "dash-badge",
  em_andamento: "dash-badge font-medium text-foreground",
  concluido: "dash-badge",
  cancelado: "dash-badge opacity-60",
} as const;

export const budgetStatusLabels = {
  rascunho: "Rascunho",
  aguardando_aprovacao: "Aguardando cliente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  convertido: "Convertido em nota",
} as const;

export const budgetStatusColors = {
  rascunho: "dash-badge opacity-60",
  aguardando_aprovacao: "dash-badge font-medium text-foreground",
  aprovado: "dash-badge",
  rejeitado: "dash-badge opacity-60",
  convertido: "dash-badge",
} as const;

export const serviceNoteStatusLabels = {
  rascunho: "Rascunho",
  emitida: "Emitida",
  paga: "Paga",
  cancelada: "Cancelada",
} as const;

export const serviceNoteStatusColors = {
  rascunho: "dash-badge opacity-60",
  emitida: "dash-badge font-medium text-foreground",
  paga: "dash-badge",
  cancelada: "dash-badge opacity-60",
} as const;
