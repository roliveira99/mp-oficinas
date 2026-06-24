import { NextResponse } from "next/server";
import { getWorkshopInsights } from "@/lib/db/dashboard-insights";
import { getRequestUser, userHasPermission } from "@/lib/db/request-auth";

export async function GET() {
  const user = await getRequestUser();
  if (!user?.workshopId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (user.role !== "dono" && !userHasPermission(user, "owner.dashboard")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  try {
    const insights = await getWorkshopInsights(user.workshopId);
    return NextResponse.json(insights);
  } catch (err) {
    console.error("[dashboard/insights]", err);
    return NextResponse.json({ error: "Não foi possível carregar o desempenho." }, { status: 500 });
  }
}
