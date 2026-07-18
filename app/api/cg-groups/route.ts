import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { canManageCgGroups } from "@/lib/auth/roles";
import { createCgGroup } from "@/lib/cg-groups/data";

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session || !session.orgId) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid" }, { status: 401 });
  }

  if (!canManageCgGroups(session.role)) {
    return NextResponse.json({ ok: false, error: "Hanya Coach yang bisa membuat CG" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";

  if (!code.trim()) {
    return NextResponse.json({ ok: false, error: "Kode CG wajib diisi" }, { status: 400 });
  }

  const result = await createCgGroup(session.orgId, session.uid, { code });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 409 });
  }

  return NextResponse.json({ ok: true, cgGroup: result.cgGroup });
}
