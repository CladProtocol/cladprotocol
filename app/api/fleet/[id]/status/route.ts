import { NextRequest, NextResponse } from "next/server";
import { setInstanceStatus } from "@/api/fleet";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = await setInstanceStatus({ instanceId: id, status: body.status });
    return NextResponse.json(result);
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHENTICATED" ? 401 : 400 });
  }
}
