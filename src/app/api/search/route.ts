import { NextResponse } from "next/server";
import { searchSite } from "@/lib/db/site-search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const result = await searchSite(q);
  return NextResponse.json(result);
}
