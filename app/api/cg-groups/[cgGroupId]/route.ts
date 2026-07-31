import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { canDeleteCgGroup } from "@/lib/auth/roles";
import { getCgGroupMembersForSession } from "@/lib/cg-groups/members";
import { deleteCgGroupForSession, type MemberDisposition } from "@/lib/cg-groups/delete";

export async function GET(request: NextRequest, { params }: { params: Promise<{ cgGroupId: string }> }) {
  const { cgGroupId } = await params;
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  if (!canDeleteCgGroup(session.role)) {
    return NextResponse.json({ ok: false, error: "Hanya Coach yang bisa mengelola CG" }, { status: 403 });
  }

  const members = await getCgGroupMembersForSession(session, cgGroupId);
  return NextResponse.json({ ok: true, members });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ cgGroupId: string }> }) {
  const { cgGroupId } = await params;
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason : "";
  const dispositions: MemberDisposition[] = Array.isArray(body?.dispositions) ? body.dispositions : [];

  const result = await deleteCgGroupForSession(session, cgGroupId, { reason, dispositions });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, ...result });
}
