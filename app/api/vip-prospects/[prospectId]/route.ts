import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { updateVipProspectForSession } from "@/lib/vip-prospects/update";
import { deleteVipProspectForSession } from "@/lib/vip-prospects/delete";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ prospectId: string }> }) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const { prospectId } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Data yang dikirim tidak valid" }, { status: 400 });
  }

  const result = await updateVipProspectForSession(session, prospectId, body);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, fieldErrors: result.fieldErrors },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true, prospect: result.prospect });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ prospectId: string }> }) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const { prospectId } = await params;
  const result = await deleteVipProspectForSession(session, prospectId);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, prospectId: result.prospectId });
}
