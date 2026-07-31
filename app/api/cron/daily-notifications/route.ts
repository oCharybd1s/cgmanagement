import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/firebase/firebase-admin";
import { runDailyNotificationJob } from "@/lib/notifications/scheduled";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET belum dikonfigurasi" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let adminServices: ReturnType<typeof getAdminServices>;
  try {
    adminServices = getAdminServices();
  } catch {
    return NextResponse.json({ ok: false, error: "Konfigurasi server belum lengkap" }, { status: 500 });
  }

  const orgRefs = await adminServices.adminDb.collection("organizations").listDocuments();
  const summaries = [];

  for (const orgRef of orgRefs) {
    const summary = await runDailyNotificationJob(adminServices.adminDb, orgRef.id);
    summaries.push(summary);
    console.log("daily notification job done", summary);
  }

  return NextResponse.json({ ok: true, summaries });
}
