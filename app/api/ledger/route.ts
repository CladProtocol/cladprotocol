import { NextResponse } from "next/server";
import { listAttestations } from "@/api/ledger";

export async function GET() {
  try {
    const result = await listAttestations({});
    return NextResponse.json(result);
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHENTICATED" ? 401 : 500 });
  }
}
