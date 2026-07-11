import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/dal";

export async function GET() {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user: session });
}
