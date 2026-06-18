import { NextResponse } from "next/server";
import { listPayments } from "@/api/payments";

export async function GET() {
  try {
    const result = await listPayments({});
    return NextResponse.json(result);
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHENTICATED" ? 401 : 500 });
  }
}
