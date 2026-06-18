import { NextResponse } from "next/server";
import { getNonce } from "@/api/auth";

export async function POST() {
  try {
    const result = await getNonce();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
