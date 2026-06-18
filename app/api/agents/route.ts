import { type NextRequest, NextResponse } from "next/server";
import { listAgents } from "@/api/agents";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get("kind") as "digital" | "physical" | null;
    const category = searchParams.get("category") ?? undefined;
    const q = searchParams.get("q") ?? undefined;
    const result = await listAgents({ kind: kind ?? undefined, category, q });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
