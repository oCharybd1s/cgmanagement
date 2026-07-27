import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { updateMeetingReportForSession } from "@/lib/meeting-reports/update";
import { deleteMeetingReportForSession } from "@/lib/meeting-reports/delete";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const { reportId } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Data yang dikirim tidak valid" }, { status: 400 });
  }

  const result = await updateMeetingReportForSession(session, reportId, body);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, fieldErrors: result.fieldErrors },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true, report: result.report });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const { reportId } = await params;
  const result = await deleteMeetingReportForSession(session, reportId);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, reportId: result.reportId });
}
