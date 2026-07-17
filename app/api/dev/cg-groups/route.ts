import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { canUseDemoRoleSwitch } from "@/lib/auth/demo-role-switch";
import { getCgGroupsForOrg } from "@/lib/cg-groups/data";

export async function GET(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session || !canUseDemoRoleSwitch(session) || !session.orgId) {
    return NextResponse.json({ ok: false, error: "Tidak diizinkan" }, { status: 403 });
  }

  const cgGroups = await getCgGroupsForOrg(session.orgId);
  return NextResponse.json({ ok: true, cgGroups });
}
