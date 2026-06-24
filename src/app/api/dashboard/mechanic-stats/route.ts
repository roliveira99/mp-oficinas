import { NextResponse } from "next/server";
import { getMechanicDashboardStats } from "@/lib/db/mechanic-dashboard-stats";
import { getRequestUser } from "@/lib/db/request-auth";

export async function GET(request: Request) {
  const user = await getRequestUser();
  if (!user?.workshopId || user.role !== "mecanico") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") ?? "month") as "day" | "week" | "month";

  try {
    const stats = await getMechanicDashboardStats(user, period);
    if (!stats) return NextResponse.json({ error: "Sem dados." }, { status: 404 });
    return NextResponse.json(stats);
  } catch (err) {
    console.error("[dashboard/mechanic-stats]", err);
    return NextResponse.json({ error: "Não foi possível carregar estatísticas." }, { status: 500 });
  }
}
