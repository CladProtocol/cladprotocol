import { NextRequest, NextResponse } from "next/server";
import { verifySiwe } from "@/api/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await verifySiwe(body);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }
}
