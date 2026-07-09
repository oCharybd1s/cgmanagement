import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : request.headers.get("x-forwarded-host") || request.headers.get("host") || "local";

  const isVercel = Boolean(process.env.VERCEL);

  return NextResponse.json({
    ok: true,
    message: "Aplikasi sehat",
    vercel: {
      env: isVercel ? "vercel" : "local",
      url: vercelUrl,
      isProduction: Boolean(process.env.VERCEL_ENV === "production"),
    },
  });
}
