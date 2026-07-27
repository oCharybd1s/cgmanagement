import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { getOwnMemberForSession } from "@/lib/members/data";
import { updateOwnAvatarForSession } from "@/lib/members/update-avatar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE_HEADERS = { "Cache-Control": "no-store, must-revalidate" };

export async function GET(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Sesi tidak valid, silakan login ulang" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const member = await getOwnMemberForSession(session);

  if (!member) {
    return NextResponse.json(
      { ok: false, error: "Data profil tidak ditemukan" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  return NextResponse.json({ ok: true, member }, { headers: NO_STORE_HEADERS });
}

export async function PATCH(request: NextRequest) {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(cookieValue, true);

  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Sesi tidak valid, silakan login ulang" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "Data yang dikirim tidak valid" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const result = await updateOwnAvatarForSession(session, (body as { avatarId?: unknown }).avatarId);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ ok: true, avatarId: result.avatarId }, { headers: NO_STORE_HEADERS });
}
