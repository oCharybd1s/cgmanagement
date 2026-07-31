import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { canCreateOrganization } from "@/lib/auth/roles";
import { createOrganizationForSession, getOrganizationsForSession } from "@/lib/organizations/data";

export async function GET(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session || !canCreateOrganization(session.role)) {
    return NextResponse.json({ ok: false, error: "Tidak diizinkan" }, { status: 403 });
  }

  const organizations = await getOrganizationsForSession(session);
  return NextResponse.json({ ok: true, organizations });
}

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Sesi tidak valid, silakan login ulang" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const orgId = typeof body?.orgId === "string" ? body.orgId : "";
  const name = typeof body?.name === "string" ? body.name : "";

  const result = await createOrganizationForSession(session, { orgId, name });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, orgId: result.orgId });
}
