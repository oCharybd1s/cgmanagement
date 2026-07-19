import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { demoteCglForSession } from "@/lib/organizations/promote";

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const cgGroupId = typeof body?.cgGroupId === "string" ? body.cgGroupId : "";

  const result = await demoteCglForSession(session, { cgGroupId });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, cgGroupId: result.cgGroupId, demotedUserId: result.demotedUserId });
}
