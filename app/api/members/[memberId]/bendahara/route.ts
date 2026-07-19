import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { setBendaharaStatusForSession } from "@/lib/members/bendahara";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const { memberId } = await params;
  const body = await request.json().catch(() => null);
  const isBendahara = body && typeof body === "object" ? (body as Record<string, unknown>).isBendahara : undefined;

  if (typeof isBendahara !== "boolean") {
    return NextResponse.json({ ok: false, error: "Data yang dikirim tidak valid" }, { status: 400 });
  }

  const result = await setBendaharaStatusForSession(session, memberId, isBendahara);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, memberId: result.memberId, isBendahara: result.isBendahara });
}
