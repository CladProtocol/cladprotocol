import { NextResponse } from "next/server";
import { getDashboardOverview } from "@/api/dashboard";

export async function GET() {
  try {
    const result = await getDashboardOverview();
    return NextResponse.json(result);
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHENTICATED" ? 401 : 500 });
  }
}
