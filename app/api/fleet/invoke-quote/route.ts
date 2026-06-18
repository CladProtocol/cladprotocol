import { NextRequest, NextResponse } from "next/server";
import { getInvokeQuote } from "@/api/earn";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await getInvokeQuote(body);
    return NextResponse.json(result);
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ error: msg }, { status: msg === "UNAUTHENTICATED" ? 401 : 400 });
  }
}
