import { NextResponse } from "next/server";
import { getInstance } from "@/api/fleet";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await getInstance({ instanceId: id });
    return NextResponse.json(result);
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHENTICATED" ? 401 : 500 });
  }
}
