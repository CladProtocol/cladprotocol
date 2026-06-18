import { NextResponse } from "next/server";
import { haltFleet } from "@/api/fleet";

export async function POST() {
  try {
    const result = await haltFleet();
    return NextResponse.json(result);
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHENTICATED" ? 401 : 500 });
  }
}
