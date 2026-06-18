import { NextResponse } from "next/server";
import { logoutUser } from "@/api/auth";

export async function POST() {
  try {
    const result = await logoutUser();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
