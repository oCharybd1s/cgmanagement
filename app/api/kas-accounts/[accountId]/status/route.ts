import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { setKasAccountStatusForSession } from "@/lib/kas-accounts/status";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ accountId: string }> }) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const { accountId } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || typeof body.active !== "boolean") {
    return NextResponse.json({ ok: false, error: "Data yang dikirim tidak valid" }, { status: 400 });
  }

  const result = await setKasAccountStatusForSession(session, accountId, body.active);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, account: result.account });
}
