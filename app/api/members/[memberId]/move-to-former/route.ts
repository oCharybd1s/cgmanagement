import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";
import { moveActiveMemberToFormerForSession } from "@/lib/former-members/create";
import type { FormerMemberReason } from "@/lib/former-members/types";

const VALID_REASONS = new Set<FormerMemberReason>(["graduated", "moved", "unresponsive", "other"]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
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

  const rawReason = (body as Record<string, unknown>).reason;
  const rawNotes = (body as Record<string, unknown>).notes;

  if (!rawReason || !VALID_REASONS.has(rawReason as FormerMemberReason)) {
    return NextResponse.json({ ok: false, error: "Alasan tidak valid" }, { status: 400 });
  }

  const notes = typeof rawNotes === "string" ? rawNotes.trim() || null : null;

  const result = await moveActiveMemberToFormerForSession(
    session,
    memberId,
    rawReason as FormerMemberReason,
    notes,
  );

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, formerMemberId: result.formerMemberId });
}
