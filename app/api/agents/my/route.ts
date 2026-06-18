import { NextResponse } from "next/server";
import { getMyAgents } from "@/api/agents";

export async function GET() {
  try {
    const result = await getMyAgents();
    return NextResponse.json(result);
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHENTICATED" ? 401 : 500 });
  }
}
