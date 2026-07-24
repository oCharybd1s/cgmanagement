import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { getMemberPasswordStatusForSession, resetMemberPasswordForSession } from "@/lib/members/reset-password";

export async function GET(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const { memberId } = await params;
  const result = await getMemberPasswordStatusForSession(session, memberId);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    mustChangePassword: result.mustChangePassword,
    temporaryPasswordPending: result.temporaryPasswordPending,
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const { memberId } = await params;
  const result = await resetMemberPasswordForSession(session, memberId);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, temporaryPassword: result.temporaryPassword });
}
