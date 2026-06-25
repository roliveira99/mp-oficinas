import type { AgendaRequest } from "@/types/workshop";

function formatDateBr(date: string): string {
  const d = new Date(date + "T12:00:00");
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function slotLabel(date: string, time: string): string {
  return `${formatDateBr(date)} às ${time}`;
}

export function buildAgendaApproveMessage(
  req: Pick<AgendaRequest, "clientName" | "service" | "preferredDate" | "preferredTime">,
  workshopName: string
): string {
  return `Olá, ${req.clientName}! Sua solicitação de ${req.service} para ${slotLabel(req.preferredDate, req.preferredTime)} foi *APROVADA* pela ${workshopName}. Qualquer dúvida, estamos à disposição.`;
}

export function buildAgendaContactMessage(
  req: Pick<AgendaRequest, "clientName" | "service" | "preferredDate" | "preferredTime">,
  workshopName: string
): string {
  return `Olá, ${req.clientName}! Aqui é da ${workshopName}, sobre seu agendamento de ${req.service} em ${slotLabel(req.preferredDate, req.preferredTime)}. Podemos falar?`;
}

export function buildAgendaProposeChangeMessage(
  req: Pick<AgendaRequest, "clientName" | "service" | "preferredDate" | "preferredTime">,
  workshopName: string,
  proposedDate: string,
  proposedTime: string
): string {
  return [
    `Olá, ${req.clientName}!`,
    `Aqui é da ${workshopName}, sobre seu agendamento de *${req.service}*.`,
    ``,
    `O horário solicitado (${slotLabel(req.preferredDate, req.preferredTime)}) não está disponível.`,
    `Podemos reagendar para *${slotLabel(proposedDate, proposedTime)}*?`,
    ``,
    `Por favor, confirme se esse novo horário funciona para você.`,
  ].join("\n");
}

export function buildAgendaConfirmChangeMessage(
  req: Pick<AgendaRequest, "clientName" | "service">,
  workshopName: string,
  date: string,
  time: string
): string {
  return `Olá, ${req.clientName}! Confirmado: seu ${req.service} na ${workshopName} ficou agendado para ${slotLabel(date, time)}. Até lá!`;
}

export function buildAgendaRejectMessage(
  req: Pick<AgendaRequest, "clientName" | "service" | "preferredDate" | "preferredTime">,
  workshopName: string
): string {
  return `Olá, ${req.clientName}. Infelizmente não conseguimos atender sua solicitação de ${req.service} para ${slotLabel(req.preferredDate, req.preferredTime)} na ${workshopName}. Entre em contato para buscarmos outro horário.`;
}
