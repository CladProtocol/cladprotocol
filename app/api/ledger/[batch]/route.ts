import { NextResponse } from "next/server";
import { getAttestation } from "@/api/ledger";

export async function GET(_req: Request, { params }: { params: Promise<{ batch: string }> }) {
  try {
    const { batch } = await params;
    const result = await getAttestation({ batch: Number(batch) });
    return NextResponse.json(result);
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHENTICATED" ? 401 : 500 });
  }
}
