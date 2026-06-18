import { NextResponse } from "next/server";
import { getMe } from "@/api/auth";

export async function GET() {
  try {
    const result = await getMe();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
