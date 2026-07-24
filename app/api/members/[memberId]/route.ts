import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { updateMemberForSession } from "@/lib/members/update";
import { deleteMemberForSession } from "@/lib/members/delete";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const { memberId } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Data yang dikirim tidak valid" }, { status: 400 });
  }

  const result = await updateMemberForSession(session, memberId, body);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, fieldErrors: result.fieldErrors },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true, member: result.member });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const { memberId } = await params;
  const result = await deleteMemberForSession(session, memberId);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, memberId: result.memberId });
}
