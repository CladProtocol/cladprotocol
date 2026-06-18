import { type NextRequest, NextResponse } from "next/server";
import { listInstances } from "@/api/fleet";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get("kind") as "digital" | "physical" | null;
    const result = await listInstances({ kind: kind ?? undefined });
    return NextResponse.json(result);
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHENTICATED" ? 401 : 500 });
  }
}
