import { NextResponse } from "next/server";
import { createAgendaRequest, getAgendaRequests, updateAgendaStatus } from "@/lib/db/agenda";
import { getWorkshopById } from "@/lib/db/workshops";
import { getRequestUser, userCanManageAgenda } from "@/lib/db/request-auth";

export async function GET(request: Request) {
  const user = await getRequestUser();
  if (!user?.workshopId || !userCanManageAgenda(user)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const requests = await getAgendaRequests(user.workshopId);
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: "create" | "approve" | "reject";
    workshopId?: string;
    clientName?: string;
    clientPhone?: string;
    vehicle?: string;
    preferredDate?: string;
    preferredTime?: string;
    service?: string;
    id?: string;
  };

  if (body.action === "approve" || body.action === "reject") {
    const user = await getRequestUser();
    if (!user?.workshopId || !userCanManageAgenda(user)) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    if (!body.id) {
      return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    }

    const requests = await getAgendaRequests(user.workshopId);
    const req = requests.find((r) => r.id === body.id);
    const status = body.action === "approve" ? "aprovado" : "recusado";
    await updateAgendaStatus(body.id, status);

    if (body.action === "approve" && req) {
      const workshop = await getWorkshopById(req.workshopId);
      if (workshop) {
        const { buildWhatsAppUrl } = await import("@/lib/whatsapp");
        const message = `Olá, ${req.clientName}! Sua solicitação de ${req.service} para ${req.preferredDate} às ${req.preferredTime} foi APROVADA pela ${workshop.name}. Qualquer dúvida, estamos à disposição.`;
        const whatsappUrl = buildWhatsAppUrl(req.clientPhone, message);
        return NextResponse.json({ ok: true, whatsappUrl });
      }
    }

    return NextResponse.json({ ok: true });
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
