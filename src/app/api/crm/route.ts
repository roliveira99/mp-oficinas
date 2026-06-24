import { NextResponse } from "next/server";
import {
  addAsset,
  addClient,
  addFictionalMechanic,
  addVehicle,
  assignMechanicToOrder,
  completeOrder,
  createOrder,
  getAllMechanicAssignees,
  getCrmData,
  getMechanicProductivity,
  linkVehicleToClient,
  setFictionalMechanicActive,
  unlinkVehicleFromClient,
  updateOrderStatus,
} from "@/lib/db/crm";
import { getRequestUser, userHasPermission } from "@/lib/db/request-auth";
import type { MechanicKind, ServiceOrderStatus } from "@/types/client";

function workshopIdFromUser(user: { workshopId: string | null }) {
  if (!user.workshopId) throw new Error("NO_WORKSHOP");
  return user.workshopId;
}

export async function GET() {
  const user = await getRequestUser();
  if (!user?.workshopId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const data = await getCrmData(user.workshopId);
  const productivity = await getMechanicProductivity(user.workshopId);
  const assignees = await getAllMechanicAssignees(user.workshopId);
  return NextResponse.json({ ...data, productivity, assignees });
}

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user?.workshopId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const action = body.action as string;

  try {
    const workshopId = workshopIdFromUser(user);

    switch (action) {
      case "add-client": {
        if (!userHasPermission(user, "gerencia.cadastro_clientes") && !userHasPermission(user, "owner.cadastro_clientes")) {
          return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
        }
        const result = await addClient(workshopId, {
          name: body.name as string,
          phone: body.phone as string,
          cpf: body.cpf as string,
        });
        return NextResponse.json(result);
      }
      case "add-asset": {
        const result = await addAsset(workshopId, {
          referenceKey: body.referenceKey as string,
          label: body.label as string,
          assetType: body.assetType as import("@/types/client").BusinessAssetType | undefined,
          year: body.year as string | undefined,
          clientId: body.clientId as string | undefined,
        });
        return NextResponse.json(result);
      }
      case "add-vehicle": {
        const result = await addVehicle(workshopId, {
          plate: body.plate as string,
          model: body.model as string,
          year: body.year as string | undefined,
          clientId: body.clientId as string | undefined,
        });
        return NextResponse.json(result);
      }
      case "link-vehicle": {
        const result = await linkVehicleToClient(
          workshopId,
          body.vehicleId as string,
          body.clientId as string
        );
        return NextResponse.json(result);
      }
      case "unlink-vehicle": {
        const result = await unlinkVehicleFromClient(workshopId, body.vehicleId as string);
        return NextResponse.json(result);
      }
      case "create-order": {
        const result = await createOrder(workshopId, {
          vehicleId: body.vehicleId as string | undefined,
          service: body.service as string,
          value: body.value as number,
          mechanicId: body.mechanicId as string,
          mechanicKind: body.mechanicKind as MechanicKind,
          clientId: body.clientId as string | undefined,
          status: body.status as ServiceOrderStatus | undefined,
          lineItems: body.lineItems as import("@/types/document-line").DocumentLineItem[] | undefined,
          paymentMethods: body.paymentMethods as string[] | undefined,
        });
        return NextResponse.json(result);
      }
      case "complete-order":
      case "update-order-status": {
        const status = (body.status as ServiceOrderStatus) ?? "concluido";
        const result =
          action === "complete-order"
            ? await completeOrder(workshopId, body.orderId as string)
            : await updateOrderStatus(workshopId, body.orderId as string, status);
        return NextResponse.json(result);
      }
      case "assign-mechanic": {
        const result = await assignMechanicToOrder(
          workshopId,
          body.orderId as string,
          body.mechanicId as string,
          body.mechanicKind as MechanicKind
        );
        return NextResponse.json(result);
      }
      case "add-fictional": {
        const result = await addFictionalMechanic(workshopId, {
          name: body.name as string,
          specialty: body.specialty as string | undefined,
          notes: body.notes as string | undefined,
        });
        return NextResponse.json(result);
      }
      case "set-fictional-active": {
        const result = await setFictionalMechanicActive(
          workshopId,
          body.mechanicId as string,
          body.active as boolean
        );
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Oficina não vinculada ao usuário." }, { status: 400 });
  }
}
