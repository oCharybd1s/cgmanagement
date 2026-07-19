import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { setBendaharaForSession } from "@/lib/organizations/promote";

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const cgGroupId = typeof body?.cgGroupId === "string" ? body.cgGroupId : "";
  const memberId = typeof body?.memberId === "string" ? body.memberId : "";
  const isBendahara = body?.isBendahara === true;

  const result = await setBendaharaForSession(session, { cgGroupId, memberId, isBendahara });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    cgGroupId: result.cgGroupId,
    memberId: result.memberId,
    isBendahara: result.isBendahara,
  });
}
