import { NextResponse } from "next/server";
import {
  confirmAgendaChange,
  cancelAgendaChange,
  createAgendaRequest,
  getAgendaRequest,
  getAgendaRequests,
  proposeAgendaChange,
  updateAgendaStatus,
} from "@/lib/db/agenda";
import { getWorkshopById } from "@/lib/db/workshops";
import { getRequestUser, userCanManageAgenda } from "@/lib/db/request-auth";
import {
  buildAgendaApproveMessage,
  buildAgendaConfirmChangeMessage,
  buildAgendaContactMessage,
  buildAgendaProposeChangeMessage,
  buildAgendaRejectMessage,
} from "@/lib/agenda-messages";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type AgendaAction =
  | "create"
  | "approve"
  | "reject"
  | "whatsapp"
  | "propose-change"
  | "confirm-change"
  | "cancel-change";

export async function GET() {
  const user = await getRequestUser();
  if (!user?.workshopId || !userCanManageAgenda(user)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const requests = await getAgendaRequests(user.workshopId);
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: AgendaAction;
    workshopId?: string;
    clientName?: string;
    clientPhone?: string;
    vehicle?: string;
    preferredDate?: string;
    preferredTime?: string;
    service?: string;
    id?: string;
    proposedDate?: string;
    proposedTime?: string;
  };

  const managedActions: AgendaAction[] = [
    "approve",
    "reject",
    "whatsapp",
    "propose-change",
    "confirm-change",
    "cancel-change",
  ];

  if (body.action && managedActions.includes(body.action)) {
    const user = await getRequestUser();
    if (!user?.workshopId || !userCanManageAgenda(user)) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    if (!body.id) {
      return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    }

    const req = await getAgendaRequest(user.workshopId, body.id);
    if (!req) {
      return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });
    }

    const workshop = await getWorkshopById(req.workshopId);
    const workshopName = workshop?.name ?? "nosso negócio";

    if (body.action === "whatsapp") {
      const message = buildAgendaContactMessage(req, workshopName);
      return NextResponse.json({
        ok: true,
        whatsappUrl: buildWhatsAppUrl(req.clientPhone, message),
      });
    }

    if (body.action === "propose-change") {
      if (!body.proposedDate || !body.proposedTime) {
        return NextResponse.json({ error: "Informe a nova data e horário." }, { status: 400 });
      }
      const updated = await proposeAgendaChange(
        user.workshopId,
        body.id,
        body.proposedDate,
        body.proposedTime
      );
      if (!updated) {
        return NextResponse.json({ error: "Não foi possível propor alteração." }, { status: 400 });
      }
      const message = buildAgendaProposeChangeMessage(
        req,
        workshopName,
        body.proposedDate,
        body.proposedTime
      );
      return NextResponse.json({
        ok: true,
        request: updated,
        whatsappUrl: buildWhatsAppUrl(req.clientPhone, message),
      });
    }

    if (body.action === "confirm-change") {
      const updated = await confirmAgendaChange(user.workshopId, body.id);
      if (!updated) {
        return NextResponse.json({ error: "Nenhuma alteração pendente para confirmar." }, { status: 400 });
      }
      const message = buildAgendaConfirmChangeMessage(
        updated,
        workshopName,
        updated.preferredDate,
        updated.preferredTime
      );
      return NextResponse.json({
        ok: true,
        request: updated,
        whatsappUrl: buildWhatsAppUrl(updated.clientPhone, message),
      });
    }

    if (body.action === "cancel-change") {
      const updated = await cancelAgendaChange(user.workshopId, body.id);
      if (!updated) {
        return NextResponse.json({ error: "Não foi possível cancelar a alteração." }, { status: 400 });
      }
      return NextResponse.json({ ok: true, request: updated });
    }

    if (body.action === "approve") {
      const ok = await updateAgendaStatus(user.workshopId, body.id, "aprovado");
      if (!ok) return NextResponse.json({ error: "Não foi possível aprovar." }, { status: 400 });
      const message = buildAgendaApproveMessage(req, workshopName);
      return NextResponse.json({
        ok: true,
        whatsappUrl: buildWhatsAppUrl(req.clientPhone, message),
      });
    }

    if (body.action === "reject") {
      const ok = await updateAgendaStatus(user.workshopId, body.id, "recusado");
      if (!ok) return NextResponse.json({ error: "Não foi possível recusar." }, { status: 400 });
      const message = buildAgendaRejectMessage(req, workshopName);
      return NextResponse.json({
        ok: true,
        whatsappUrl: buildWhatsAppUrl(req.clientPhone, message),
      });
    }
  }

  if (!body.workshopId || !body.clientName || !body.clientPhone || !body.preferredDate || !body.preferredTime || !body.service) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  const workshop = await getWorkshopById(body.workshopId);
  if (!workshop?.hasAgenda) {
    return NextResponse.json({ error: "Esta oficina não aceita agenda online." }, { status: 400 });
  }

  const created = await createAgendaRequest({
    workshopId: body.workshopId,
    clientName: body.clientName,
    clientPhone: body.clientPhone,
    vehicle: body.vehicle,
    preferredDate: body.preferredDate,
    preferredTime: body.preferredTime,
    service: body.service,
  });

  return NextResponse.json({ request: created }, { status: 201 });
}
